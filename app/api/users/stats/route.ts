import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to data files
const ROOMS_FILE = join(process.cwd(), "data", "rooms.json")
const LOOPS_DIR = join(process.cwd(), "data", "loops")
const USERS_FILE = join(process.cwd(), "data", "users.json")
const EXPORTS_FILE = join(process.cwd(), "data", "exports.json")

// Initialize exports file if it doesn't exist
if (!existsSync(EXPORTS_FILE)) {
  const fs = require("fs")
  fs.writeFileSync(EXPORTS_FILE, JSON.stringify([]), "utf8")
}

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

    // Count rooms hosted by user
    const hostedRooms = rooms.filter((room: any) => room.hostId === userId)
    const totalRoomsHosted = hostedRooms.length

    // Count total loops recorded by user
    let totalLoopsRecorded = 0
    let totalLoopsInSessions = 0
    let sessionsWithLoops = 0

    // Read all loop files for each room
    for (const room of rooms) {
      const loopsFile = join(LOOPS_DIR, `${room.id}.json`)
      if (existsSync(loopsFile)) {
        const loopsData = readFileSync(loopsFile, "utf8")
        const loops = JSON.parse(loopsData)

        // Count user's loops
        const userLoops = loops.filter((loop: any) => loop.userId === userId)
        totalLoopsRecorded += userLoops.length

        // Count total loops in sessions where user participated
        if (room.participants && room.participants.includes(userId) && loops.length > 0) {
          totalLoopsInSessions += loops.length
          sessionsWithLoops++
        }
      }
    }

    // Calculate average loops per session
    const averageLoopsPerSession = sessionsWithLoops > 0 ? (totalLoopsInSessions / sessionsWithLoops).toFixed(1) : "0"

    // Read exports data
    let totalMixdownExports = 0
    if (existsSync(EXPORTS_FILE)) {
      const exportsData = readFileSync(EXPORTS_FILE, "utf8")
      const exports = JSON.parse(exportsData)
      totalMixdownExports = exports.filter((exp: any) => exp.userId === userId).length
    }

    // Get user data
    const usersData = readFileSync(USERS_FILE, "utf8")
    const users = JSON.parse(usersData)
    const user = users.find((u: any) => u.id === userId)

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

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
