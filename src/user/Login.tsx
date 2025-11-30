import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./loginApi";
import { Session } from "../model/common";
import { CustomError } from "../model/CustomError";

interface LoginProps {
    onLogin: (session: any) => void;
}

export function Login({ onLogin }: LoginProps) {

    const navigate = useNavigate();

    const [error, setError] = useState({} as CustomError);
    const [session, setSession] = useState({} as Session);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);

        loginUser(
            {
                user_id: -1,
                username: data.get('login') as string,
                password: data.get('password') as string
            },
            (result: Session) => {
                console.log(result);
                setSession(result);
                form.reset();
                setError(new CustomError(""));
                onLogin(result); // ← met à jour isLoggedIn dans App
                navigate("/messages", { state: { session: result, chatWithId: 2 } });           },
            (loginError: CustomError) => {
                console.log(loginError);
                setError(loginError);
                setSession({} as Session);
            }
        );
    };

    return (
        <>
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="card p-4 shadow" style={{ minWidth: '350px' }}>
                    <h2 className="text-center mb-4">Connexion</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="login" className="form-label">Login</label>
                            <input
                                name="login"
                                type="text"
                                className="form-control"
                                placeholder="Nom d'utilisateur"
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Mot de passe</label>
                            <input
                                name="password"
                                type="password"
                                className="form-control"
                                placeholder="Mot de passe"
                            />
                        </div>
                        {error.message && <div className="alert alert-danger">{error.message}</div>}
                        {session.token && <div className="alert alert-success">Bienvenue, {session.username}</div>}
                        <button type="submit" className="btn btn-primary w-100">Se connecter</button>
                    </form>
                    <p className="mt-3 text-center">
                        Pas encore de compte ? <a href="/register">S'inscrire</a>
                    </p>
                </div>
            </div>
        </>
    );
}
