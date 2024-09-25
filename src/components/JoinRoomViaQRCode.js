// JoinRoomViaQRCode.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { joinRoom } from './JoinRoom'; // Importer la fonction joinRoom

function JoinRoomViaQRCode() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [playerName, setPlayerName] = useState('');  // State for the player's name
    const [nameEntered, setNameEntered] = useState(false);  // State to track if the player entered a name

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                if (!nameEntered) {
                    // Demander le nom du joueur
                    const enteredName = prompt('Please enter your player name:', 'Player');
                    if (enteredName) {
                        setPlayerName(enteredName);
                        setNameEntered(true);
                    } else {
                        setPlayerName('Anonymous Player');
                        setNameEntered(true);
                    }
                } else {
                    const playerId = Date.now() + uuidv4(); // Générer un playerId unique
                    joinRoom(roomCode, playerName, playerId, navigate); // Appeler la fonction joinRoom
                    setLoading(false);
                }
            } else {
                setLoading(false);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [roomCode, navigate, playerName, nameEntered]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return null;
}

export default JoinRoomViaQRCode;
