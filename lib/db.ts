import { v4 as uuidv4 } from "uuid"
import { put, del } from "@vercel/blob"
import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"

// Helper function to convert MongoDB document to plain object with string ID
const docToObject = (doc: any) => {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...rest }
}

// Database and collection names
const DB_NAME = "soundboard"
const USERS_COLLECTION = "users"
const ROOMS_COLLECTION = "rooms"
const LOOPS_COLLECTION = "loops"
const EXPORTS_COLLECTION = "exports"

// User operations
export async function getUsers() {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(USERS_COLLECTION)
  const users = await collection.find({}).toArray()
  return users.map(docToObject)
}

export async function getUserById(userId: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(USERS_COLLECTION)
  try {
    const user = await collection.findOne({ _id: new ObjectId(userId) })
    return docToObject(user)
  } catch (error) {
    // Handle case where userId is not a valid ObjectId
    return null
  }
}

export async function getUserByEmail(email: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(USERS_COLLECTION)
  const user = await collection.findOne({ email })
  return docToObject(user)
}

export async function createUser(userData: any) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(USERS_COLLECTION)

  const newUser = {
    ...userData,
    createdAt: new Date().toISOString(),
  }

  const result = await collection.insertOne(newUser)
  return { id: result.insertedId.toString(), ...newUser }
}

// Room operations
export async function getRooms() {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(ROOMS_COLLECTION)
  const rooms = await collection.find({}).toArray()
  return rooms.map(docToObject)
}

export async function getRoomById(roomId: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(ROOMS_COLLECTION)
  try {
    const room = await collection.findOne({ _id: new ObjectId(roomId) })
    return docToObject(room)
  } catch (error) {
    // Handle case where roomId is not a valid ObjectId
    return null
  }
}

export async function getRoomByCode(code: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(ROOMS_COLLECTION)
  const room = await collection.findOne({ code })
  return docToObject(room)
}

export async function createRoom(roomData: any) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(ROOMS_COLLECTION)

  const newRoom = {
    ...roomData,
    participants: [roomData.hostId],
    createdAt: new Date().toISOString(),
  }

  const result = await collection.insertOne(newRoom)
  return { id: result.insertedId.toString(), ...newRoom }
}

export async function updateRoom(roomId: string, updates: any) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(ROOMS_COLLECTION)

  try {
    await collection.updateOne({ _id: new ObjectId(roomId) }, { $set: updates })

    const updatedRoom = await collection.findOne({ _id: new ObjectId(roomId) })
    return docToObject(updatedRoom)
  } catch (error) {
    return null
  }
}

// Loop operations
export async function getLoopsByRoomId(roomId: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(LOOPS_COLLECTION)
  const loops = await collection.find({ roomId }).toArray()
  return loops.map(docToObject)
}

export async function getLoopById(loopId: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(LOOPS_COLLECTION)

  try {
    const loop = await collection.findOne({ _id: new ObjectId(loopId) })
    return docToObject(loop)
  } catch (error) {
    // Try finding by UUID if not a valid ObjectId
    const loop = await collection.findOne({ id: loopId })
    return docToObject(loop)
  }
}

export async function createLoop(loopData: any, audioFile: File) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(LOOPS_COLLECTION)

  const loopId = uuidv4()

  // Upload audio to Vercel Blob
  const { url } = await put(`loops/${loopId}.wav`, audioFile, {
    access: "public",
  })

  const newLoop = {
    id: loopId, // Keep a UUID for blob reference
    ...loopData,
    audioUrl: url,
    createdAt: new Date().toISOString(),
  }

  const result = await collection.insertOne(newLoop)
  return { id: result.insertedId.toString(), ...newLoop }
}

export async function deleteLoop(loopId: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(LOOPS_COLLECTION)

  try {
    // Find the loop first to get its details
    let loop
    try {
      loop = await collection.findOne({ _id: new ObjectId(loopId) })
    } catch (error) {
      // Try finding by UUID if not a valid ObjectId
      loop = await collection.findOne({ id: loopId })
    }

    if (!loop) {
      return false
    }

    // Delete the audio file from Vercel Blob
    try {
      await del(`loops/${loop.id}.wav`)
    } catch (error) {
      console.error("Error deleting audio file:", error)
    }

    // Delete the loop document
    if (ObjectId.isValid(loopId)) {
      await collection.deleteOne({ _id: new ObjectId(loopId) })
    } else {
      await collection.deleteOne({ id: loopId })
    }

    return true
  } catch (error) {
    console.error("Error deleting loop:", error)
    return false
  }
}

// Export operations
export async function getExports() {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(EXPORTS_COLLECTION)
  const exports = await collection.find({}).toArray()
  return exports.map(docToObject)
}

export async function createExport(exportData: any) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(EXPORTS_COLLECTION)

  const newExport = {
    ...exportData,
    createdAt: new Date().toISOString(),
  }

  const result = await collection.insertOne(newExport)
  return { id: result.insertedId.toString(), ...newExport }
}

export async function getExportsByUserId(userId: string) {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(EXPORTS_COLLECTION)
  const exports = await collection.find({ userId }).toArray()
  return exports.map(docToObject)
}
