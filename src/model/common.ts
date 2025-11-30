import {CustomError} from "./CustomError";

export const AUTHENT_HEADER = "Authentication";
export const BEARER = "Bearer ";

export interface User {
    user_id: number;
    username: string;
    email?: string;
    password: string;
    last_login?: string;
    external_id?: string;
}
export interface Message {
    message_id: number;
    sender_id: number;
    receiver_id: number;
    content?: string;
    media_url?: string;
    media_type?: "image" | "video";
    created_on: string;
}

export interface Room {
    room_id: number;
    name: string;
    created_on: string;
    created_by: number;
}
export interface Session {
    token: string;
    username?: string;
    id?: number;
    externalId: string;
}


export interface EmptyCallback {
    (): void;
}

export interface SessionCallback {
    (session: Session): void;
}


export interface ErrorCallback {
    (error: CustomError): void;
}

