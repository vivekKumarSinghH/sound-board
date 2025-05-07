import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getRooms, createRoom, getUserById } from "@/lib/db"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Helper function to generate a random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// GET all rooms for the authenticated user
export async function GET(request: NextRequest) {
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

    // Get all rooms
    const rooms = await getRooms()

    // Get query parameters
    const url = new URL(request.url)
    const filter = url.searchParams.get("filter") || "all" // "all", "my", "joined"

    let filteredRooms = []

    if (filter === "my") {
      // Filter rooms where the user is the host
      filteredRooms = rooms.filter((room: any) => room.hostId === userId)
    } else if (filter === "joined") {
      // Filter rooms where the user is a participant but not the host
      filteredRooms = rooms.filter(
        (room: any) => room.participants && room.participants.includes(userId) && room.hostId !== userId,
      )
    } else {
      // All rooms the user can access (host of or participant in)
      filteredRooms = rooms.filter(
        (room: any) => room.hostId === userId || (room.participants && room.participants.includes(userId)),
      )
    }

    // Add host name to each room
    const roomsWithHostNames = await Promise.all(
      filteredRooms.map(async (room: any) => {
        const host = await getUserById(room.hostId)
        return {
          ...room,
          hostName: host ? host.name : "Unknown User",
          // Don't send password in response
          hasPassword: !!room.password,
          password: undefined,
          // Count unique participants
          participantCount: room.participants ? new Set(room.participants).size : 1,
        }
      }),
    )

    return NextResponse.json({
      rooms: roomsWithHostNames,
    })
  } catch (error) {
    console.error("Get rooms error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}

// POST create a new room
export async function POST(request: NextRequest) {
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

    // Get request body
    const { title, bpm, keySignature, isPublic, password } = await request.json()

    // Validate input
    if (!title) {
      return NextResponse.json({ message: "Room title is required" }, { status: 400 })
    }

    // Create new room
    const newRoom = await createRoom({
      title,
      bpm: bpm || 120,
      keySignature: keySignature || "C",
      isPublic: isPublic !== undefined ? isPublic : true,
      password: password || null, // Store password for private rooms
      hostId: decoded.userId,
      code: generateRoomCode(),
    })

    // Don't send password in response
    const { password: _, ...roomWithoutPassword } = newRoom

    return NextResponse.json({
      message: "Room created successfully",
      room: {
        ...roomWithoutPassword,
        hasPassword: !!password,
        participantCount: 1,
      },
    })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
