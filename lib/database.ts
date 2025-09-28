import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // put this in .env.local
    // ssl: { rejectUnauthorized: false }, // uncomment if you need SSL (cloud DB)
})

export async function withClient<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
        return await fn(client)
    } finally {
        client.release()
    }
}
