import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById } from "./db"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

export async function getCurrentUser(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { userId: string }

    // Get user data
    const user = await getUserById(decoded.userId)
    if (!user) {
      return null
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function getUserFromRequest(request: NextRequest) {
  return getCurrentUser(request)
}
