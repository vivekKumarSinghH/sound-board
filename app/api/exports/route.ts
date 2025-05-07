import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to exports data file
const DATA_DIR = join(process.cwd(), "data")
const EXPORTS_FILE = join(DATA_DIR, "exports.json")

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Initialize exports file if it doesn't exist
if (!existsSync(EXPORTS_FILE)) {
  writeFileSync(EXPORTS_FILE, JSON.stringify([]), "utf8")
}

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

    // Read exports data
    const exportsData = readFileSync(EXPORTS_FILE, "utf8")
    const exports = JSON.parse(exportsData)

    // Create new export record
    const newExport = {
      id: uuidv4(),
      userId,
      roomId,
      loopCount: loopCount || 0,
      duration: duration || 0,
      createdAt: new Date().toISOString(),
    }

    // Add export to the list
    exports.push(newExport)

    // Save updated exports list
    writeFileSync(EXPORTS_FILE, JSON.stringify(exports, null, 2), "utf8")

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
