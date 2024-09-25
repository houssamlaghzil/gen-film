// App.js
import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Home from './components/Home';
import CreateRoom from './components/room-gestion/CreateRoom';
import JoinRoom from './components/room-gestion/JoinRoom';
import WaitingRoom from './components/room-gestion/WaitingRoom';
import GamePhase1 from './components/gen-films/GamePhase1';
import GamePhase2 from './components/gen-films/GamePhase2';
import GamePhase3 from './components/gen-films/GamePhase3';
import FusionPrompt from './components/gen-films/FusionPrompt';
import Scoreboard from './components/gen-films/Scoreboard';
import FusionGuessing from "./components/gen-films/FusionGuessing";
import './App.css';

console.log('App.js chargé');



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
                    <Route path="/" element={<Home/>}/>
                    <Route path="/create-room" element={<CreateRoom/>}/>
                    <Route path="/join-room" element={<JoinRoom/>}/>
                    <Route path="/waiting-room/:roomCode" element={<WaitingRoom/>}/>
                    <Route path="/game/phase1/:roomCode" element={<GamePhase1/>}/>
                    <Route path="/game/phase2/:roomCode" element={<GamePhase2/>}/>
                    <Route path="/game/phase3/:roomCode" element={<GamePhase3/>}/>
                    <Route path="/fusion-prompt/:roomCode" element={<FusionPrompt/>}/>
                    <Route path="/fusion-guessing/:roomCode" element={<FusionGuessing/>}/>
                    <Route path="/scoreboard/:roomCode" element={<Scoreboard/>}/>
                </Routes>
            </div>
        </Router>
    );
}

export default App;
