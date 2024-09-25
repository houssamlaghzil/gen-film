// Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

console.log('Home.js chargé');

function Home() {
    const [pseudo, setPseudo] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        console.log('Création de la room demandée');
        navigate('/create-room', { state: { pseudo } });
    };

    const handleJoinRoom = () => {
        console.log('Demande de rejoindre la room:', roomCode);
        navigate('/join-room', { state: { pseudo, roomCode } });
    };

    return (
        <div>
            <h1>Bienvenue dans le jeu v1</h1>
            <input
                type="text"
                placeholder="Entrez votre pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
            />
            <input
                type="text"
                placeholder="Code de la room"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
            />
            <button onClick={handleCreateRoom}>Créer une room</button>
            <button onClick={handleJoinRoom}>Rejoindre une room</button>
        </div>
    );
}

export default Home;
