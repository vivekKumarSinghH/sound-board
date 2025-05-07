import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getLoopById, deleteLoop, getRoomById } from "@/lib/db"

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

    // Get the loop - properly await the params
    const { id: loopId } = await params
    const loop = await getLoopById(loopId)

    if (!loop) {
      return NextResponse.json({ message: "Loop not found" }, { status: 404 })
    }

    return NextResponse.json(loop)
  } catch (error) {
    console.error("Get loop error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the loop - properly await the params
    const { id: loopId } = await params
    const loop = await getLoopById(loopId)

    if (!loop) {
      return NextResponse.json({ message: "Loop not found" }, { status: 404 })
    }

    // Check if user is authorized to delete this loop
    const room = await getRoomById(loop.roomId)
    if (loop.userId !== userId && room.hostId !== userId) {
      return NextResponse.json({ message: "Unauthorized to delete this loop" }, { status: 403 })
    }

    // Delete the loop
    await deleteLoop(loopId)

    return NextResponse.json({ message: "Loop deleted successfully" })
  } catch (error) {
    console.error("Delete loop error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
