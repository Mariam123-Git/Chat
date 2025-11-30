import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface NavProps {
    isLoggedIn: boolean;
    logout: () => void;
}

const Nav: React.FC<NavProps> = ({ isLoggedIn, logout }) => {
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();            // met à jour l'état dans App pour isLoggedIn = false
        navigate("/login");  // redirection vers la page login
    };
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">ChatApp</Link>
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        {isLoggedIn && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/todo">ToDo List</Link>
                            </li>
                        )}
                    </ul>
                    <div className="d-flex">
                        {isLoggedIn ? (
                            <button className="btn btn-danger btn-outline-light" onClick={handleLogout}>Déconnexion</button>
                        ) : (
                            <>
                            <Link className="btn btn-outline-light" to="/Login">Connexion</Link>
                            <Link className="btn btn-outline-light" to="/Register">s'inscrire</Link>
                            </>
                            )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Nav;
