import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { sign } from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to users data file
const DATA_DIR = join(process.cwd(), "data")
const USERS_FILE = join(DATA_DIR, "users.json")

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Initialize users file if it doesn't exist
if (!existsSync(USERS_FILE)) {
  writeFileSync(USERS_FILE, JSON.stringify([]), "utf8")
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email, and password are required" }, { status: 400 })
    }

    // Read existing users
    const usersData = readFileSync(USERS_FILE, "utf8")
    const users = JSON.parse(usersData)

    // Check if user already exists
    const existingUser = users.find((user: any) => user.email === email)
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Create new user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password, // In a real app, you would hash this password
      createdAt: new Date().toISOString(),
    }

    // Add user to the list
    users.push(newUser)

    // Save updated users list
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8")

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
