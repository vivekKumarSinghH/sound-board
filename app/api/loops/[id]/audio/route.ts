import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getLoopById } from "@/lib/db"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    verify(token, JWT_SECRET)

    // Get the loop - properly await the params
    const { id: loopId } = await params
    const loop = await getLoopById(loopId)

    if (!loop || !loop.audioUrl) {
      return NextResponse.json({ message: "Audio file not found" }, { status: 404 })
    }

    // Redirect to the audio URL (stored in Vercel Blob)
    return NextResponse.redirect(loop.audioUrl)
  } catch (error) {
    console.error("Get audio error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
