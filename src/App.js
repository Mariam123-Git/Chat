import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import  Nav from './component/Nav';
import { Login } from './user/Login';
import { Register } from './user/Register';
import { Messages } from "./user/Messages";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [session, setSession] = useState(null);

    const handleLogin = (userSession) => {
        setSession(userSession);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setSession(null);
        setIsLoggedIn(false);
    };

    return (
        <Router>
            <Nav isLoggedIn={isLoggedIn} logout={handleLogout} />
            <Routes>
                <Route path="/" element={<Login onLogin={handleLogin} />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/messages" element={<Messages session={session} chatWithId={2} />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </Router>
    );
}

export default App;

