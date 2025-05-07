import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getRoomByCode, updateRoom } from "@/lib/db"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

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

    // Find room by code
    const room = await getRoomByCode(roomCode.toUpperCase())
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
      await updateRoom(room.id, { participants: room.participants })
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
