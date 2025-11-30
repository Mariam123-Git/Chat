// /api/private-rooms.js
import { db } from "@vercel/postgres";
import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = Redis.fromEnv();

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
            status: 405,
            headers: { "content-type": "application/json" },
        });
    }

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

        const userData = await redis.get(token);
        if (!userData) {
            return new Response(JSON.stringify({ error: "Session expirée" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            });
        }

        const currentUser = typeof userData === "string" ? JSON.parse(userData) : userData;

        // Lire les données
        const { other_user_id } = await request.json();

        if (!other_user_id) {
            return new Response(JSON.stringify({ error: "Utilisateur cible manquant" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }

        const client = await db.connect();

        // Vérifier si une conversation privée existe déjà
        const existingRoom = await client.sql`
            SELECT r.room_id, r.name, r.room_type, r.created_on,
                   u.username as other_username
            FROM rooms r
            JOIN room_users ru1 ON r.room_id = ru1.room_id
            JOIN room_users ru2 ON r.room_id = ru2.room_id
            JOIN users u ON u.user_id = ru2.user_id
            WHERE r.room_type = 'private'
            AND ru1.user_id = ${currentUser.id}
            AND ru2.user_id = ${other_user_id}
            AND ru1.user_id != ru2.user_id
        `;

        if (existingRoom.rows.length > 0) {
            await client.release();
            return new Response(JSON.stringify(existingRoom.rows[0]), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        }

        // Créer une nouvelle room privée
        const roomResult = await client.sql`
            INSERT INTO rooms (name, room_type, created_on)
            VALUES ('Private Chat', 'private', NOW())
            RETURNING *
        `;

        const newRoom = roomResult.rows[0];

        // Ajouter les deux utilisateurs à la room
        await client.sql`
            INSERT INTO room_users (room_id, user_id, joined_on)
            VALUES (${newRoom.room_id}, ${currentUser.id}, NOW()),
                   (${newRoom.room_id}, ${other_user_id}, NOW())
        `;

        // Récupérer le nom de l'autre utilisateur
        const otherUserResult = await client.sql`
            SELECT username FROM users WHERE user_id = ${other_user_id}
        `;
        const otherUsername = otherUserResult.rows[0]?.username;

        newRoom.other_username = otherUsername;
        newRoom.other_user_id = other_user_id;

        await client.release();

        return new Response(JSON.stringify(newRoom), {
            status: 200,
            headers: { "content-type": "application/json" },
        });

    } catch (error) {
        console.error("Erreur /api/private-rooms:", error);
        return new Response(JSON.stringify({ error: "Erreur serveur" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
}