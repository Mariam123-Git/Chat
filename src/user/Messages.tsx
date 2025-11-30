import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Session, Room, Message } from "../model/common";
import { getRooms, getMessages, sendMessage } from "./MessagesApi";

interface Props {
    session: Session | null;
}

interface RoomUser {
    user_id: number;
    username: string;
}

export function Messages({ session }: Props) {
    const navigate = useNavigate();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeRoom, setActiveRoom] = useState<Room | null>(null);
    const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [textContent, setTextContent] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Redirection si pas de session
    useEffect(() => {
        if (!session || !session.token) {
            navigate("/login");
            return;
        }

        getRooms(session.token)
            .then(setRooms)
            .catch(err => {
                console.error("Erreur getRooms:", err);
                alert("Erreur: " + err.message);
            });
    }, [session, navigate]);

    // Charger messages et utilisateurs de la room active
    useEffect(() => {
        if (!session || !activeRoom) return;

        getMessages(session.token, activeRoom.room_id)
            .then(setMessages)
            .catch(err => console.error("Erreur getMessages:", err));

        fetch(`/api/roomUsers?room_id=${activeRoom.room_id}`, {
            headers: { Authorization: `Bearer ${session.token}` },
        })
            .then(res => res.json())
            .then((data: RoomUser[]) => setRoomUsers(data))
            .catch(err => console.error("Erreur getRoomUsers:", err));
    }, [activeRoom, session]);

    // Envoi de message texte
    const handleSendText = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !activeRoom || !textContent.trim()) return;

        try {
            const newMsg = await sendMessage(session.token, activeRoom.room_id, textContent);
            setMessages(prev => [...prev, newMsg]);
            setTextContent("");
        } catch (err: any) {
            console.error("Erreur sendMessage:", err);
            alert("Erreur: " + err.message);
        }
    };

    // Sélection du fichier média
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setMediaFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Envoi de média
    // Envoi de média
    const handleSendMedia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !activeRoom || !mediaFile) return;

        try {
            console.log("Envoi du fichier:", mediaFile.name, mediaFile.type, mediaFile.size);

            const newMsg = await sendMessage(session.token, activeRoom.room_id, "", mediaFile);
            setMessages(prev => [...prev, newMsg]);
            setMediaFile(null);
            setPreviewUrl(null);
        } catch (err: any) {
            console.error("Erreur détaillée sendMedia:", err);

            let errorMessage = "Erreur lors de l'envoi du média";
            if (err.message.includes("trop volumineux")) {
                errorMessage = "Le fichier est trop volumineux (max 50MB)";
            } else if (err.message.includes("Type de fichier non supporté")) {
                errorMessage = "Type de fichier non supporté. Utilisez des images (JPEG, PNG, GIF, WebP) ou vidéos (MP4, WebM, OGG)";
            } else if (err.message.includes("Erreur HTTP 413")) {
                errorMessage = "Fichier trop volumineux pour le serveur";
            }

            alert("Erreur: " + errorMessage);
        }
    };

    // Auto-scroll vers le dernier message
    useEffect(() => {
        const chatBox = document.getElementById("chat-box");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, [messages]);

    // Formater la date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        navigate("/login");
    };

    if (!session) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
            </div>
        </div>
    );

    return (
        <div className="vh-100 d-flex flex-column">
            <div className="d-flex flex-grow-1 overflow-hidden">
                {/* Sidebar */}
                <div className="bg-light border-end" style={{ width: "280px", overflowY: "auto" }}>
                    <div className="p-3">
                        <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: "0.85rem" }}>
                            Utilisateurs
                        </h6>
                        <div className="card mb-3">
                            <div className="card-body py-2">
                                <div className="fw-bold">{session.username}</div>
                                <small className="text-muted">
                                    {formatDate(new Date().toISOString())}
                                </small>
                            </div>
                        </div>

                        <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: "0.85rem" }}>
                            Salons
                        </h6>
                        <div className="list-group">
                            {rooms.map(room => (
                                <button
                                    key={room.room_id}
                                    className={`list-group-item list-group-item-action ${
                                        activeRoom?.room_id === room.room_id ? "active" : ""
                                    }`}
                                    onClick={() => setActiveRoom(room)}
                                >
                                    <div className="d-flex w-100 justify-content-between">
                                        <h6 className="mb-1">{room.name}</h6>
                                    </div>
                                    <small className={activeRoom?.room_id === room.room_id ? "text-white-50" : "text-muted"}>
                                        {formatDate(room.created_on)}
                                    </small>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Zone de chat */}
                <div className="flex-grow-1 d-flex flex-column">
                    {activeRoom ? (
                        <>
                            {/* En-tête du salon */}
                            <div className="border-bottom p-3 bg-white">
                                <h5 className="mb-0">Chat: {activeRoom.name}</h5>
                                {roomUsers.length > 0 && (
                                    <small className="text-muted">
                                        Membres: {roomUsers.map(u => u.username).join(", ")}
                                    </small>
                                )}
                            </div>

                            {/* Messages */}
                            <div
                                id="chat-box"
                                className="flex-grow-1 p-3 overflow-auto"
                                style={{ backgroundColor: "#f8f9fa" }}
                            >
                                {messages.length === 0 ? (
                                    <div className="text-center text-muted mt-5">
                                        <p>Aucun message dans ce salon</p>
                                    </div>
                                ) : (
                                    messages.map(msg => {
                                        const isMyMessage = msg.sender_id === session.id;

                                        return (
                                            <div
                                                key={msg.message_id}
                                                className={`mb-3 d-flex ${
                                                    isMyMessage ? "justify-content-end" : "justify-content-start"
                                                }`}
                                            >
                                                <div
                                                    className={`d-flex flex-column ${
                                                        isMyMessage ? "align-items-end" : "align-items-start"
                                                    }`}
                                                    style={{ maxWidth: "70%" }}
                                                >
                                                    {/* Nom de l'expéditeur pour les messages reçus */}
                                                    {!isMyMessage && (
                                                        <small className="text-muted mb-1 ms-1">
                                                            {roomUsers.find(u => u.user_id === msg.sender_id)?.username || "Utilisateur"}
                                                        </small>
                                                    )}

                                                    <div className="d-flex align-items-end">
                                                        {/* Contenu du message */}
                                                        <div
                                                            className={`rounded p-2 ${
                                                                isMyMessage
                                                                    ? "bg-primary text-white"
                                                                    : "bg-white border"
                                                            }`}
                                                            style={{
                                                                maxWidth: "100%",
                                                                wordWrap: "break-word"
                                                            }}
                                                        >
                                                            {msg.content && (
                                                                <div>{msg.content}</div>
                                                            )}
                                                            {msg.media_url && msg.media_type === "image" && (
                                                                <img
                                                                    src={msg.media_url}
                                                                    alt="media"
                                                                    className="img-fluid rounded mt-1"
                                                                    style={{ maxWidth: "200px" }}
                                                                />
                                                            )}
                                                            {msg.media_url && msg.media_type === "video" && (
                                                                <video
                                                                    src={msg.media_url}
                                                                    controls
                                                                    className="rounded mt-1"
                                                                    style={{ maxWidth: "200px" }}
                                                                >
                                                                    <track kind="captions" />
                                                                </video>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Horodatage */}
                                                    <small
                                                        className={`text-muted mt-1 ${
                                                            isMyMessage ? "me-1" : "ms-1"
                                                        }`}
                                                    >
                                                        {new Date(msg.created_on).toLocaleTimeString("fr-FR", {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </small>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Zone de saisie */}
                            <div className="border-top p-3 bg-white">
                                {/* Preview du média */}
                                {previewUrl && (
                                    <div className="mb-2 position-relative d-inline-block">
                                        <img src={previewUrl} alt="Preview" className="img-thumbnail" style={{ maxWidth: "150px" }} />
                                        <button
                                            className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                            onClick={() => {
                                                setMediaFile(null);
                                                setPreviewUrl(null);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {/* Formulaire texte */}
                                <form onSubmit={handleSendText} className="mb-2">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Message"
                                            value={textContent}
                                            onChange={e => setTextContent(e.target.value)}
                                        />
                                        <button className="btn btn-primary" type="submit">
                                            Envoyer
                                        </button>
                                    </div>
                                </form>

                                {/* Formulaire média */}
                                <form onSubmit={handleSendMedia}>
                                    <div className="input-group">
                                        <input
                                            type="file"
                                            className="form-control"
                                            onChange={handleFileChange}
                                            accept="image/*,video/*"
                                        />
                                        <button
                                            className="btn btn-success"
                                            type="submit"
                                            disabled={!mediaFile}
                                        >
                                            🖼️ IMAGE
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                            <div style={{ fontSize: "5rem" }}>🦜</div>
                            <p className="text-muted">Sélectionnez un salon pour commencer</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}