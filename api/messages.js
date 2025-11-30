import { db } from "@vercel/postgres";
import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = Redis.fromEnv();

export default async function handler(request) {
    try {
        // Vérifier l'authentification
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();

        console.log("🔑 Token reçu:", token ? "présent" : "absent");

        if (!token) {
            console.error("❌ Pas de token");
            return new Response(JSON.stringify({ error: "Utilisateur non connecté" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            });
        }

        const user = await redis.get(token);
        console.log("👤 User depuis Redis:", user ? "trouvé" : "non trouvé");

        if (!user) {
            console.error("❌ Token invalide ou expiré");
            return new Response(JSON.stringify({ error: "Session expirée, veuillez vous reconnecter" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            });
        }

        // Récupérer le room_id depuis l'URL
        const { searchParams } = new URL(request.url);
        const roomId = parseInt(searchParams.get("room_id") || "0");

        console.log("🏠 Room ID demandé:", roomId);

        if (!roomId) {
            console.error("❌ Room ID manquant");
            return new Response(JSON.stringify({ error: "Room non spécifiée" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }

        // Récupérer les messages du salon
        const client = await db.connect();

        console.log("🔍 Recherche des messages pour room_id =", roomId);

        const { rows } = await client.sql`
            SELECT
                m.message_id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.media_url,
                m.media_type,
                m.created_on,
                u.username AS sender_name
            FROM messages m
                     JOIN users u ON u.user_id = m.sender_id
            WHERE m.receiver_id = ${roomId}
            ORDER BY m.created_on ASC
        `;

        console.log("✅ Messages trouvés:", rows.length);

        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        console.error("💥 Erreur /api/messages:", err);
        return new Response(JSON.stringify({
            error: "Erreur serveur",
            details: err.message
        }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
}