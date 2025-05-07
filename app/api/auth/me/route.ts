import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to users data file
const USERS_FILE = join(process.cwd(), "data", "users.json")

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

    // Check if users file exists
    if (!existsSync(USERS_FILE)) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Read users data
    const usersData = readFileSync(USERS_FILE, "utf8")
    const users = JSON.parse(usersData)

    // Find user by ID
    const user = users.find((u: any) => u.id === decoded.userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}
