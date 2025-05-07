import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getLoopsByRoomId, createLoop, getRoomById, getUserById } from "@/lib/db"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the room ID - properly await the params
    const { id: roomId } = await params

    // Check if room exists
    const room = await getRoomById(roomId)
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 })
    }

    // Get loops for this room
    const loops = await getLoopsByRoomId(roomId)

    return NextResponse.json({ loops })
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { userId: string }
    const userId = decoded.userId

    // Get the room ID - properly await the params
    const { id: roomId } = await params

    // Check if room exists
    const room = await getRoomById(roomId)
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 })
    }

    // Get user data to include username
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Process the form data
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const name = (formData.get("name") as string) || "Untitled Loop"

    if (!audioFile) {
      return NextResponse.json({ message: "No audio file provided" }, { status: 400 })
    }

    // Create the loop
    const loop = await createLoop(
      {
        roomId,
        userId,
        userName: user.name,
        name,
        orderIndex: 0, // Default order
      },
      audioFile,
    )

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
