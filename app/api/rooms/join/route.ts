import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to rooms data file
const DATA_DIR = join(process.cwd(), "data")
const ROOMS_FILE = join(DATA_DIR, "rooms.json")

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
    const { roomCode, password } = await request.json()

    // Validate input
    if (!roomCode) {
      return NextResponse.json({ message: "Room code is required" }, { status: 400 })
    }

    // Read rooms data
    if (!existsSync(ROOMS_FILE)) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 })
    }

    const roomsData = readFileSync(ROOMS_FILE, "utf8")
    const rooms = JSON.parse(roomsData)

    // Find room by code
    const room = rooms.find((r: any) => r.code === roomCode.toUpperCase())
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 })
    }

    // Check if room is private and requires password
    if (!room.isPublic && room.password) {
      if (!password) {
        return NextResponse.json({ message: "Password is required for this room" }, { status: 403 })
      }
      if (password !== room.password) {
        return NextResponse.json({ message: "Incorrect password" }, { status: 403 })
      }
    }

    // Check if user is already a participant
    if (!room.participants) {
      room.participants = [room.hostId]
    }

    if (!room.participants.includes(decoded.userId)) {
      // Add user to participants
      room.participants.push(decoded.userId)

      // Save updated rooms list
      writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2), "utf8")
    }

    // Don't send password in response
    const { password: _, ...roomWithoutPassword } = room

    return NextResponse.json({
      message: "Joined room successfully",
      room: {
        ...roomWithoutPassword,
        hasPassword: !!room.password,
      },
    })
  } catch (error) {
    console.error("Join room error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
