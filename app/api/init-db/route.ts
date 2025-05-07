import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { createUser } from "@/lib/db"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("soundboard")

    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    if (!collectionNames.includes("users")) {
      await db.createCollection("users")
      // Create index on email for faster lookups
      await db.collection("users").createIndex({ email: 1 }, { unique: true })
    }

    if (!collectionNames.includes("rooms")) {
      await db.createCollection("rooms")
      // Create index on code for faster lookups
      await db.collection("rooms").createIndex({ code: 1 }, { unique: true })
    }

    if (!collectionNames.includes("loops")) {
      await db.createCollection("loops")
      // Create index on roomId for faster lookups
      await db.collection("loops").createIndex({ roomId: 1 })
    }

    if (!collectionNames.includes("exports")) {
      await db.createCollection("exports")
      // Create index on userId for faster lookups
      await db.collection("exports").createIndex({ userId: 1 })
    }

    // Check if we have any users, if not create a test user
    const usersCount = await db.collection("users").countDocuments()

    if (usersCount === 0) {
      await createUser({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      })
    }

    return NextResponse.json({
      message: "Database initialized successfully",
      collections: collectionNames,
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        message: "Database initialization failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
