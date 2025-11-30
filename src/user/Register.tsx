import { useState } from "react";
import { registerUser } from "./RegisterApi";
import { Session } from "../model/common";
import { CustomError } from "../model/CustomError";

export function Register() {
    const [error, setError] = useState({} as CustomError);
    const [session, setSession] = useState({} as Session);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);

        registerUser(
            {
                user_id: -1,
                username: data.get('username') as string,
                password: data.get('password') as string,
                email: data.get('email') as string
            },
            (result: Session) => {
                setSession(result);
                form.reset();
                setError(new CustomError(""));
            },
            (registerError: CustomError) => {
                setError(registerError);
                setSession({} as Session);
            }
        );
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow" style={{ minWidth: '350px' }}>
                <h2 className="text-center mb-4">Créer un compte</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Nom d'utilisateur</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className="form-control"
                            placeholder="Nom d'utilisateur"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-control"
                            placeholder="Email"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Mot de passe</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-control"
                            placeholder="Mot de passe"
                            required
                        />
                    </div>
                    {error.message && <div className="alert alert-danger">{error.message}</div>}
                    {session.token && <div className="alert alert-success">Bienvenue, {session.username}</div>}
                    <button type="submit" className="btn btn-primary w-100">S'inscrire</button>
                </form>
                <p className="mt-3 text-center">
                    Déjà un compte ? <a href="/login">Se connecter</a>
                </p>
            </div>
        </div>
    );
}
