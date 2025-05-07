import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to rooms data file
const DATA_DIR = join(process.cwd(), "data")
const ROOMS_FILE = join(DATA_DIR, "rooms.json")
const USERS_FILE = join(DATA_DIR, "users.json")

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Initialize rooms file if it doesn't exist
if (!existsSync(ROOMS_FILE)) {
  writeFileSync(ROOMS_FILE, JSON.stringify([]), "utf8")
}

// Initialize users file if it doesn't exist
if (!existsSync(USERS_FILE)) {
  writeFileSync(USERS_FILE, JSON.stringify([]), "utf8")
}

// Ensure loops directory exists
const LOOPS_DIR = join(DATA_DIR, "loops")
if (!existsSync(LOOPS_DIR)) {
  mkdirSync(LOOPS_DIR, { recursive: true })
}

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

    // Read rooms data
    const roomsData = readFileSync(ROOMS_FILE, "utf8")
    const rooms = JSON.parse(roomsData)

    // Get query parameters
    const url = new URL(request.url)
    const filter = url.searchParams.get("filter") || "all" // "all", "my", "public", "joined"

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

    // Read users data to get host names
    const usersData = readFileSync(USERS_FILE, "utf8")
    const users = JSON.parse(usersData)

    // Add host name to each room
    const roomsWithHostNames = filteredRooms.map((room: any) => {
      const host = users.find((user: any) => user.id === room.hostId)
      return {
        ...room,
        hostName: host ? host.name : "Unknown User",
        // Don't send password in response
        hasPassword: !!room.password,
        password: undefined,
        // Count unique participants
        participantCount: room.participants ? new Set(room.participants).size : 1,
      }
    })

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

    // Read rooms data
    const roomsData = readFileSync(ROOMS_FILE, "utf8")
    const rooms = JSON.parse(roomsData)

    // Create new room
    const newRoom = {
      id: uuidv4(),
      title,
      bpm: bpm || 120,
      keySignature: keySignature || "C",
      isPublic: isPublic !== undefined ? isPublic : true,
      password: password || null, // Store password for private rooms
      hostId: decoded.userId,
      code: generateRoomCode(),
      createdAt: new Date().toISOString(),
      participants: [decoded.userId], // Initialize with host as participant
    }

    // Add room to the list
    rooms.push(newRoom)

    // Save updated rooms list
    writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2), "utf8")

    // Create loops directory for this room
    const roomDir = join(LOOPS_DIR, newRoom.id)
    if (!existsSync(roomDir)) {
      mkdirSync(roomDir, { recursive: true })
    }

    // Create empty loops file for this room
    const loopsFile = join(LOOPS_DIR, `${newRoom.id}.json`)
    if (!existsSync(loopsFile)) {
      writeFileSync(loopsFile, JSON.stringify([]), "utf8")
    }

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
