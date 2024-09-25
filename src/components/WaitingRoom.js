// WaitingRoom.js
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { database, auth } from '../firebaseConfig';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas} from 'qrcode.react';


function WaitingRoom() {
    const { roomCode } = useParams();
    const [players, setPlayers] = useState({});
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [hostId, setHostId] = useState('');
    const navigate = useNavigate();
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        // Reference to the room's data in Firebase
        const roomRef = ref(database, `rooms/${roomCode}`);

        // Listen to changes in the room's players
        onValue(roomRef, (snapshot) => {
            const roomData = snapshot.val();
            if (roomData) {
                setPlayers(roomData.players || {});
                setHostId(roomData.hostId);
            }
        });
    }, [roomCode]);

    // Handle removing a player from the room
    const handleRemovePlayer = () => {
        if (selectedPlayer) {
            // Only allow the host to remove players
            if (currentUserId === hostId) {
                const playerRef = ref(database, `rooms/${roomCode}/players/${selectedPlayer}`);
                remove(playerRef)
                    .then(() => {
                        console.log('Player removed successfully');
                        setSelectedPlayer(''); // Reset selection
                    })
                    .catch((error) => {
                        console.error('Error removing player:', error);
                    });
            } else {
                alert('Only the host can remove players.');
            }
        }
    };

    // Generate the room URL for the QR code
    const roomUrl = `${window.location.origin}/join-room/${roomCode}/qrcode`;

    return (
        <div>
            <h2>Waiting Room</h2>

            {/* Dropdown menu to select a player to remove */}
            <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
            >
                <option value="">Select a player to remove</option>
                {Object.entries(players).map(([playerId, playerData]) => (
                    <option key={playerId} value={playerId}>
                        {playerData.name}
                    </option>
                ))}
            </select>

            <button onClick={handleRemovePlayer} disabled={!selectedPlayer}>
                Remove Player
            </button>

            {/* Display the list of players */}
            <h3>Players in the Room</h3>
            <ul>
                {Object.entries(players).map(([playerId, playerData]) => (
                    <li key={playerId}>{playerData.name}</li>
                ))}
            </ul>

            {/* QR Code for joining the room */}
            <h3>Invite players via QR Code</h3>
            <QRCodeCanvas value={roomUrl} />
            <p>Scan this QR code to join the room: {roomUrl}</p>
        </div>
    );
}

export default WaitingRoom;
