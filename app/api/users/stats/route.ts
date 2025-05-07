import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById, getRooms, getLoopsByRoomId, getExportsByUserId } from "@/lib/db"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

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

    // Get user data
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get all rooms
    const rooms = await getRooms()

    // Count rooms hosted by user
    const hostedRooms = rooms.filter((room: any) => room.hostId === userId)
    const totalRoomsHosted = hostedRooms.length

    // Count total loops recorded by user
    let totalLoopsRecorded = 0
    let totalLoopsInSessions = 0
    let sessionsWithLoops = 0

    // Check each room for loops
    for (const room of rooms) {
      if (room.participants && room.participants.includes(userId)) {
        const loops = await getLoopsByRoomId(room.id)

        // Count user's loops
        const userLoops = loops.filter((loop: any) => loop.userId === userId)
        totalLoopsRecorded += userLoops.length

        // Count total loops in sessions where user participated
        if (loops.length > 0) {
          totalLoopsInSessions += loops.length
          sessionsWithLoops++
        }
      }
    }

    // Calculate average loops per session
    const averageLoopsPerSession = sessionsWithLoops > 0 ? (totalLoopsInSessions / sessionsWithLoops).toFixed(1) : "0"

    // Get exports data
    const exports = await getExportsByUserId(userId)
    const totalMixdownExports = exports.length

    // Return user stats
    return NextResponse.json({
      stats: {
        totalRoomsHosted,
        totalLoopsRecorded,
        totalMixdownExports,
        averageLoopsPerSession,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Get user stats error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
