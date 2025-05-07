import { type NextRequest, NextResponse } from "next/server"
import { sign } from "jsonwebtoken"
import { createUser, getUserByEmail } from "@/lib/db"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Create new user
    const newUser = await createUser({
      name,
      email,
      password, // In a real app, you would hash this password
    })

    // Create JWT token
    const token = sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" })

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
