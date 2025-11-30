import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';
import { arrayBufferToBase64, stringToArrayBuffer } from "../lib/base64";

export const config = {
    runtime: 'edge',
};

const redis = Redis.fromEnv();

export default async function handler(request) {
    try {
        const { username, password, email } = await request.json();

        // Hash du mot de passe avec Web Crypto API
        const hash = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(username + password));
        const hashed64 = arrayBufferToBase64(hash);

        const client = await db.connect();

        // Vérifier si le username ou l'email existe déjà
        const { rowCount: existingCount } = await client.sql`
            SELECT 1 FROM users WHERE username = ${username} OR email = ${email}
        `;
        if (existingCount > 0) {
            return new Response(JSON.stringify({ code: "USER_EXISTS", message: "Nom d'utilisateur ou email déjà utilisé" }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        // Insérer nouvel utilisateur avec created_on
        const { rows } = await client.sql`
            INSERT INTO users (username, email, password, created_on, external_id)
            VALUES (${username}, ${email}, ${hashed64}, now(), gen_random_uuid())
                RETURNING user_id, external_id
        `;

        const user = {
            id: rows[0].user_id,
            username,
            email,
            externalId: rows[0].external_id
        };

        // Générer token et sauvegarder dans Redis
        const token = crypto.randomUUID();
        await redis.set(token, user, { ex: 3600 });
        await redis.hset("users", { [user.id]: user });

        return new Response(JSON.stringify({
            token,
            username,
            externalId: user.externalId,
            id: user.id
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ code: "INTERNAL_ERROR", message: "Erreur serveur" }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}
