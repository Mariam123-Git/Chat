import { db } from "@vercel/postgres";
import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = Redis.fromEnv();

export default async function handler(request) {
    try {
        // Vérifier l'authentification
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();

        if (!token) {
            return new Response(JSON.stringify({ error: "Utilisateur non connecté" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            });
        }

        const user = await redis.get(token);
        if (!user) {
            return new Response(JSON.stringify({ error: "Utilisateur non connecté" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            });
        }

        // Récupérer le room_id depuis l'URL
        const { searchParams } = new URL(request.url);
        const roomId = parseInt(searchParams.get("room_id") || "0");

        if (!roomId) {
            return new Response(JSON.stringify({ error: "Room non spécifiée" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }

        // Récupérer les membres du salon
        const client = await db.connect();
        const { rows } = await client.sql`
            SELECT u.user_id, u.username, u.external_id
            FROM room_users ru
            JOIN users u ON u.user_id = ru.user_id
            WHERE ru.room_id = ${roomId}
            ORDER BY u.username ASC
        `;

        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error("Erreur /api/roomUsers:", err);
        return new Response(JSON.stringify({ error: "Erreur serveur" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
}