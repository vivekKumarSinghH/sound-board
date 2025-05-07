import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/db"

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

    // Get user data
    const user = await getUserById(decoded.userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}
