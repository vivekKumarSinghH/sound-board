import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { verify } from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to data files
const ROOMS_FILE = join(process.cwd(), "data", "rooms.json")
const LOOPS_DIR = join(process.cwd(), "data", "loops")

// Ensure loops directory exists
if (!existsSync(LOOPS_DIR)) {
  mkdirSync(LOOPS_DIR, { recursive: true })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    verify(token, JWT_SECRET)

    // Extract the room ID from params
    const { id: roomId } = await params

    console.log(`Fetching loops for room ID: ${roomId}`)

    try {
      // Check if room exists
      const roomsData = readFileSync(ROOMS_FILE, "utf8")
      const rooms = JSON.parse(roomsData)
      const room = rooms.find((r: any) => r.id === roomId)

      if (!room) {
        return NextResponse.json({ message: "Room not found" }, { status: 404 })
      }

      // Get loops for this room
      const loopsFile = join(LOOPS_DIR, `${roomId}.json`)
      let loops: any[] = []

      if (existsSync(loopsFile)) {
        const loopsData = readFileSync(loopsFile, "utf8")
        loops = JSON.parse(loopsData)
      }

      return NextResponse.json({ loops })
    } catch (fileError) {
      console.error("File operation error:", fileError)
      return NextResponse.json(
        {
          message: "Error reading loops data",
          error: fileError instanceof Error ? fileError.message : String(fileError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Get loops error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { id: string; name: string }
    const userId = decoded.id
    const userName = decoded.name

    // Extract the room ID from params
    const { id: roomId } = await params

    console.log(`Creating loop for room ID: ${roomId} by user: ${userId}`)

    // Check if room exists
    const roomsData = readFileSync(ROOMS_FILE, "utf8")
    const rooms = JSON.parse(roomsData)
    const room = rooms.find((r: any) => r.id === roomId)

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 })
    }

    // Process the form data
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const name = (formData.get("name") as string) || "Untitled Loop"

    if (!audioFile) {
      return NextResponse.json({ message: "No audio file provided" }, { status: 400 })
    }

    // Generate a unique ID for the loop
    const loopId = uuidv4()

    // Save the audio file
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const audioPath = join(LOOPS_DIR, `${loopId}.wav`)

    // Ensure the directory exists
    const audioDir = dirname(audioPath)
    if (!existsSync(audioDir)) {
      mkdirSync(audioDir, { recursive: true })
    }

    writeFileSync(audioPath, buffer)
    console.log(`Saved audio file to: ${audioPath}`)

    // Create loop metadata
    const loop = {
      id: loopId,
      roomId,
      userId,
      userName,
      name,
      orderIndex: 0, // Default order
      audioUrl: `/api/loops/${loopId}/audio`,
      createdAt: new Date().toISOString(),
    }

    // Save loop metadata to room's loops file
    const loopsFile = join(LOOPS_DIR, `${roomId}.json`)
    let loops = []

    if (existsSync(loopsFile)) {
      const loopsData = readFileSync(loopsFile, "utf8")
      loops = JSON.parse(loopsData)
    }

    loops.push(loop)
    writeFileSync(loopsFile, JSON.stringify(loops, null, 2))
    console.log(`Updated loops metadata in: ${loopsFile}`)

    return NextResponse.json({ message: "Loop created successfully", loop })
  } catch (error) {
    console.error("Create loop error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
