import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getRoomById } from "@/lib/db"

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

    // Get the room - properly await the params
    const { id: roomId } = await params
    const room = await getRoomById(roomId)

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
