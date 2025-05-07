import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { sign } from "jsonwebtoken"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to users data file
const USERS_FILE = join(process.cwd(), "data", "users.json")

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Check if users file exists
    if (!existsSync(USERS_FILE)) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Read users data
    const usersData = readFileSync(USERS_FILE, "utf8")
    const users = JSON.parse(usersData)

    // Find user by email
    const user = users.find((u: any) => u.email === email)
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Check password
    if (user.password !== password) {
      // In a real app, you would compare hashed passwords
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
