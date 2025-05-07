import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    // Test MongoDB connection
    const client = await clientPromise
    const db = client.db("soundboard")

    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    const userCount = await db.collection("users").countDocuments()
    const roomCount = await db.collection("rooms").countDocuments()
    const loopCount = await db.collection("loops").countDocuments()
    const exportCount = await db.collection("exports").countDocuments()

    // Test Vercel Blob connection
    let blobStatus = "Unknown"
    let blobItems = []

    try {
      const { blobs } = await list()
      blobStatus = "Connected"
      blobItems = blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }))
    } catch (error) {
      blobStatus = `Error: ${error instanceof Error ? error.message : String(error)}`
    }

    return NextResponse.json({
      mongodb: {
        status: "Connected",
        collections: collectionNames,
        counts: {
          users: userCount,
          rooms: roomCount,
          loops: loopCount,
          exports: exportCount,
        },
      },
      vercelBlob: {
        status: blobStatus,
        items: blobItems.slice(0, 5), // Only show first 5 items
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        message: "Connection test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
