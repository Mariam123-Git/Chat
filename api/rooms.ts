import { db } from "@vercel/postgres";
import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = Redis.fromEnv();

export default async function handler(request: Request) {
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();

        if (!token) {
            return new Response(JSON.stringify({ error: "Utilisateur non connecté" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            });
        }

        // Vérifier si le token existe dans Redis
        const user = await redis.get(token);
        if (!user) {
            return new Response(JSON.stringify({ error: "Utilisateur non connecté" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            });
        }

        // Récupérer les rooms depuis PostgreSQL
        const client = await db.connect();
        const { rows } = await client.sql`SELECT room_id, name FROM rooms ORDER BY name`;

        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Erreur serveur" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
}
