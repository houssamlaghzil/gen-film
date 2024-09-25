import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from './joinRoomLogic'; // Assuming you have this logic in a separate file

function JoinRoom() {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState('');
    const [pseudo, setPseudo] = useState('');

    const handleJoin = () => {
        if (roomCode && pseudo) {
            const playerId = Date.now(); // Generate a unique player ID
            joinRoom(roomCode, pseudo, playerId, navigate);
        } else {
            alert("Please enter a room code and pseudo.");
        }
    };

    //si dans l'url on a un code "/join-room/" suivi d'un code alor on peut récupérer le code de la room
if (window.location.pathname.includes('/join-room/')) {
    const roomCodeFromUrl = window.location.pathname.split('/').pop();
    if (roomCodeFromUrl !== roomCode) {
        setRoomCode(roomCodeFromUrl);
    }
}


    return (
        <div>
            <h2>Rejoindre une room</h2>
            <input
                type="text"
                placeholder="Code de la room"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
            />
            <input
                type="text"
                placeholder="Pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
            />
            <button onClick={handleJoin}>Rejoindre la room</button>
        </div>
    );
}

export default JoinRoom;
