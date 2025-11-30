import { Message, Room } from "../model/common";

export async function getRooms(token: string): Promise<Room[]> {
    const res = await fetch("/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la récupération des salons");
    }

    return res.json();
}

export async function getMessages(token: string, roomId: number): Promise<Message[]> {
    const res = await fetch(`/api/messages?room_id=${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const text = await res.text(); // Lire le texte brut
        console.error("Réponse non JSON:", text);
        throw new Error(`Erreur HTTP ${res.status}: ${text}`);
    }


    return res.json();
}

export async function sendMessage(
    token: string,
    roomId: number,
    content = "",
    mediaFile?: File
): Promise<Message> {
    let res: Response;

    if (mediaFile) {
        // Envoi avec FormData pour le fichier
        const formData = new FormData();
        formData.append("room_id", roomId.toString());
        formData.append("content", content);
        formData.append("media", mediaFile);

        res = await fetch("/api/sendMessage", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
    } else {
        // Envoi JSON simple
        res = await fetch("/api/sendMessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ room_id: roomId, content }),
        });
    }

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de l'envoi du message");
    }

    return res.json();
}