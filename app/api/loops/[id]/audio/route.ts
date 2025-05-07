import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { verify } from "jsonwebtoken"
import { glob } from "glob"

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "soundboard-secret-key"

// Path to loops directory
const LOOPS_DIR = join(process.cwd(), "data", "loops")

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Extract the loop ID from params - await the params Promise
    const { id: loopId } = await params

    console.log(`Fetching audio for loop ID: ${loopId}`)
    console.log(`Looking in directory: ${LOOPS_DIR}`)

    // Use a try-catch block for synchronous file operations
    try {
      // Find all matching audio files
      const audioFiles = glob.sync(join(LOOPS_DIR, "**", `${loopId}.wav`))
      console.log(`Found audio files: ${JSON.stringify(audioFiles)}`)

      if (audioFiles.length === 0) {
        // Try looking for the file directly
        const directPath = join(LOOPS_DIR, `${loopId}.wav`)
        console.log(`Trying direct path: ${directPath}`)

        if (existsSync(directPath)) {
          console.log(`Found file at direct path`)
          const audioBuffer = readFileSync(directPath)
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/wav",
              "Content-Disposition": `attachment; filename="${loopId}.wav"`,
            },
          })
        }

        return NextResponse.json({ message: "Audio file not found" }, { status: 404 })
      }

      const audioPath = audioFiles[0]
      if (!existsSync(audioPath)) {
        console.log(`File exists check failed for: ${audioPath}`)
        return NextResponse.json({ message: "Audio file not found" }, { status: 404 })
      }

      console.log(`Reading file from: ${audioPath}`)
      // Read the audio file
      const audioBuffer = readFileSync(audioPath)

      // Return the audio file
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Disposition": `attachment; filename="${loopId}.wav"`,
        },
      })
    } catch (fileError) {
      console.error("File operation error:", fileError)
      return NextResponse.json(
        {
          message: "Audio file not found or inaccessible",
          error: fileError instanceof Error ? fileError.message : String(fileError),
        },
        { status: 404 },
      )
    }
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
