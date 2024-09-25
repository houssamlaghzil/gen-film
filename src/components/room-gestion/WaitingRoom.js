import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ref, onValue, off, update } from 'firebase/database';
import { QRCodeSVG } from 'qrcode.react';

function WaitingRoom() {
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;
    const [gameMode, setGameMode] = useState('');

    useEffect(() => {
        const playersRef = ref(database, `rooms/${roomCode}/players`);
        const unsubscribe = onValue(playersRef, (snapshot) => {
            const data = snapshot.val();
            const playersList = data ? Object.values(data) : [];
            setPlayers(playersList);
        });

        return () => {
            off(playersRef);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [roomCode]);

    const roomUrl = `${window.location.origin}/join-room/${roomCode}`; // URL for joining via QR code

    const startGame = () => {
        console.log('Starting game : ' + gameMode);
        if (gameMode === 'senariste') {
            const roomRef = ref(database, `rooms/${roomCode}`);
            update(roomRef, { gameStarted: true })
                .then(() => {
                    navigate(`/game/phase1/${roomCode}`, { state: { playerId, pseudo } });
                });
        } else {
            const roomRef = ref(database, `rooms/${gameMode}/${roomCode}`);
            update(roomRef, { gameStarted: true, gameMode })
                .then(() => {
                    navigate(`/game/combat_de_sorcier/${roomCode}`, { state: { playerId, pseudo, gameMode } });
                });
        }
    }

    return (
        <div>
            <h2>Code de la room: {roomCode}</h2>
            <h3>Joueurs connectés :</h3>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>{player.pseudo}</li>
                ))}
            </ul>

            <h3>Scan pour rejoindre la room:</h3>
            <QRCodeSVG value={roomUrl} /> {/* QR Code generation */}

            <select onChange={(e) => setGameMode(e.target.value)}>
                <option value="senariste">Sénariste</option>
                <option value="combat_de_sorcier">Combat de Sorcier</option>
            </select>

            {players.length >= 3 && (
                <button onClick={startGame}>Commencer la partie</button>
            )}
            {players.length < 3 && <p>En attente d'autres joueurs...</p>}
        </div>
    );
}

export default WaitingRoom;
