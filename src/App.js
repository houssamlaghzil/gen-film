// App.js
import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import {auth} from './firebaseConfig'; // Make sure this points to your firebase config
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import WaitingRoom from './components/WaitingRoom';
import GamePhase1 from './components/GamePhase1';
import GamePhase2 from './components/GamePhase2';
import GamePhase3 from './components/GamePhase3';
import FusionPrompt from './components/FusionPrompt';
import Scoreboard from './components/Scoreboard';
import FusionGuessing from "./components/FusionGuessing";
import './App.css';
import Login from "./components/Login";
import JoinRoomViaQRCode from "./components/JoinRoomViaQRCode";


console.log('App.js loaded');

function ProtectedRoute({children}) {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsAuthenticated(true);
                setLoading(false);
            } else {
                setIsAuthenticated(false);
                setLoading(false);
                navigate('/login'); // Redirect to login if not authenticated
            }
        });

        // Clean up the subscription when the component unmounts
        return () => unsubscribe();
    }, [navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? children : null;
}

function App() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <Router>
            <div className="container">
                <button className="toggle-theme" onClick={toggleTheme}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <Routes>
                    <Route path="/login" element={<Login/>}/>
                    {/* New route for joining via QR code */}
                    <Route path="/join-room/:roomCode/qrcode" element={<JoinRoomViaQRCode/>}/>
                    {/* Other routes */}
                    {/* Protect the following routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Home/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/create-room"
                        element={
                            <ProtectedRoute>
                                <CreateRoom/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/join-room"
                        element={
                            <ProtectedRoute>
                                <JoinRoom/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/waiting-room/:roomCode"
                        element={
                            <ProtectedRoute>
                                <WaitingRoom/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/game/phase1/:roomCode"
                        element={
                            <ProtectedRoute>
                                <GamePhase1/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/game/phase2/:roomCode"
                        element={
                            <ProtectedRoute>
                                <GamePhase2/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/game/phase3/:roomCode"
                        element={
                            <ProtectedRoute>
                                <GamePhase3/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/fusion-prompt/:roomCode"
                        element={
                            <ProtectedRoute>
                                <FusionPrompt/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/fusion-guessing/:roomCode"
                        element={
                            <ProtectedRoute>
                                <FusionGuessing/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/scoreboard/:roomCode"
                        element={
                            <ProtectedRoute>
                                <Scoreboard/>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
