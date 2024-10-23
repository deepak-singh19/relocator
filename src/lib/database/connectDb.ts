import mongoose, { Mongoose } from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL

interface MongooseConnection {  
    connection: Mongoose | null
    promise: Promise<Mongoose> | null
}

let cachedDb: MongooseConnection = (global as any).mongoose

if (!cachedDb) {
    cachedDb = (global as any).mongoose = { connection: null, promise: null }
}   

export async function connectDb() {
    if (cachedDb.connection) {
        return cachedDb.connection
    }

    if(!DATABASE_URL){   
        throw new Error("DATABASE_URL is not set")
    }

    cachedDb.promise =
    cachedDb.promise ||
    mongoose.connect(DATABASE_URL, { dbName: "relocator", bufferCommands: false })

    cachedDb.connection = await cachedDb.promise

  return cachedDb.connection
}

