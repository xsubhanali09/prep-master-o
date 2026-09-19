import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "prep_master";

if (!uri) {
  console.warn("MONGODB_URI is not configured.");
}

let client;
let clientPromise;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export async function getDb() {
  if (!clientPromise) throw new Error("MONGODB_URI is missing");
  const connected = await clientPromise;
  return connected.db(dbName);
}