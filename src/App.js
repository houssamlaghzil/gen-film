// App.js
import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
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

console.log('App.js chargé');

function App() {
    return (
        <Router>
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
        </Router>
    );
}

export default App;
