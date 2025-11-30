import { db } from "@vercel/postgres";
import { Redis } from "@upstash/redis";
import formidable from "formidable";
import fs from "fs";
import path from "path";

const redis = Redis.fromEnv();

export const config = {
    api: {
        bodyParser: false,
    },
};

// Créer le dossier uploads s'il n'existe pas
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Vérification d'authentification (même code que précédemment)
        const authHeader = request.headers.authorization || "";
        const token = authHeader.replace("Bearer ", "").trim();

        if (!token) {
            return response.status(401).json({ error: "Utilisateur non connecté" });
        }

        const userData = await redis.get(token);
        if (!userData) {
            return response.status(401).json({ error: "Utilisateur non connecté" });
        }

        const user = typeof userData === "string" ? JSON.parse(userData) : userData;

        let roomId, content, mediaFile;

        const form = formidable({
            maxFileSize: 50 * 1024 * 1024,
            keepExtensions: true,
            uploadDir: UPLOAD_DIR
        });

        const [fields, files] = await form.parse(request);
        roomId = parseInt(fields.room_id?.[0] || "0");
        content = fields.content?.[0] || "";
        mediaFile = files.media?.[0];

        if (!roomId) {
            return response.status(400).json({ error: "Room non spécifiée" });
        }

        const client = await db.connect();

        let mediaUrl = null;
        let mediaType = null;

        // Gestion du fichier localement
        if (mediaFile) {
            const timestamp = Date.now();
            const fileExtension = path.extname(mediaFile.originalFilename || 'file') ||
                (mediaFile.mimetype?.includes('video') ? '.mp4' : '.jpg');
            const fileName = `media_${user.id}_${timestamp}${fileExtension}`;
            const filePath = path.join(UPLOAD_DIR, fileName);

            // Déplacer le fichier vers le dossier public
            fs.renameSync(mediaFile.filepath, filePath);

            mediaUrl = `/uploads/${fileName}`;

            if (mediaFile.mimetype.startsWith("image/")) {
                mediaType = "image";
            } else if (mediaFile.mimetype.startsWith("video/")) {
                mediaType = "video";
            }
        }

        // Insertion en base
        const { rows } = await client.sql`
            INSERT INTO messages (sender_id, receiver_id, content, media_url, media_type, created_on)
            VALUES (${user.id}, ${roomId}, ${content}, ${mediaUrl}, ${mediaType}, NOW())
            RETURNING *
        `;

        const newMessage = rows[0];
        newMessage.sender_name = user.username;

        client.release();

        return response.status(200).json(newMessage);

    } catch (err) {
        console.error("Erreur /api/sendMessage:", err);
        return response.status(500).json({
            error: "Erreur serveur",
            details: err.message
        });
    }
}