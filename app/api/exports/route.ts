import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { createExport } from "@/lib/db"

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
    const userId = decoded.userId

    // Get request body
    const { roomId, loopCount, duration } = await request.json()

    // Validate input
    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 })
    }

    // Create new export record
    const newExport = await createExport({
      userId,
      roomId,
      loopCount: loopCount || 0,
      duration: duration || 0,
    })

    return NextResponse.json({
      message: "Export recorded successfully",
      export: newExport,
    })
  } catch (error) {
    console.error("Record export error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
