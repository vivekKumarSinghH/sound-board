import { type NextRequest, NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to rooms data file
const ROOMS_FILE = join(process.cwd(), "data", "rooms.json")

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

    console.log(`Fetching room ID: ${roomId}`)

    // Read rooms data
    const roomsData = readFileSync(ROOMS_FILE, "utf8")
    const rooms = JSON.parse(roomsData)

    // Find the requested room
    const room = rooms.find((room: any) => room.id === roomId)

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Get room error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
