import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to data files
const ROOMS_FILE = join(process.cwd(), "data", "rooms.json")
const LOOPS_DIR = join(process.cwd(), "data", "loops")

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { id: string }
    const userId = decoded.id

    // Extract the loop ID from params
    const { id: loopId } = await params

    console.log(`Deleting loop ID: ${loopId} by user: ${userId}`)

    // Find the room that contains this loop
    const roomsData = readFileSync(ROOMS_FILE, "utf8")
    const rooms = JSON.parse(roomsData)

    let loopFound = false
    let loopRoomId = ""
    let loopInfo = null

    // Check each room for the loop
    for (const room of rooms) {
      const loopsFile = join(LOOPS_DIR, `${room.id}.json`)

      if (existsSync(loopsFile)) {
        const loopsData = readFileSync(loopsFile, "utf8")
        const loops = JSON.parse(loopsData)

        const loopIndex = loops.findIndex((loop: any) => loop.id === loopId)

        if (loopIndex !== -1) {
          loopFound = true
          loopRoomId = room.id
          loopInfo = loops[loopIndex]

          // Check if user is authorized to delete this loop
          if (loopInfo.userId !== userId && room.hostId !== userId) {
            return NextResponse.json({ message: "Unauthorized to delete this loop" }, { status: 403 })
          }

          // Remove the loop from the array
          loops.splice(loopIndex, 1)

          // Save the updated loops data
          writeFileSync(loopsFile, JSON.stringify(loops, null, 2))
          break
        }
      }
    }

    if (!loopFound) {
      return NextResponse.json({ message: "Loop not found" }, { status: 404 })
    }

    // Delete the audio file
    try {
      const audioFile = join(LOOPS_DIR, `${loopId}.wav`)
      if (existsSync(audioFile)) {
        unlinkSync(audioFile)
      }
    } catch (error) {
      console.error("Error deleting audio file:", error)
      // Continue even if audio file deletion fails
    }

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
