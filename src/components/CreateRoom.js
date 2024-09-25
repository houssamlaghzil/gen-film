// CreateRoom.js
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { database } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { ref, set } from 'firebase/database';

console.log('CreateRoom.js chargé');

function CreateRoom() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pseudo } = location.state;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const hasExecutedRef = useRef(false);

    useEffect(() => {
        if (hasExecutedRef.current) {
            console.log('useEffect déjà exécuté, on ne fait rien');
            return;
        }
        hasExecutedRef.current = true;

        console.log('Création de la room avec le code:', roomCode);
        const playerId = uuidv4();

        // Référence à la room dans la base de données
        const roomRef = ref(database, `rooms/${roomCode}`);

        // Initialisation de la room
        set(roomRef, {
            createdAt: Date.now(),
            gameStarted: false,
            phase: 1,
            phaseComplete: false,
        })
            .then(() => {
                console.log('Room créée avec succès dans Firebase');

                // Ajout du joueur à la room
                const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
                set(playerRef, {
                    pseudo,
                    hasFinished: false,
                    scorePhase2: 0,
                    scorePhase3: 0,
                    bonusPoints: 0,
                    totalScore: 0,
                })
                    .then(() => {
                        console.log('Joueur ajouté à la room');
                        navigate(`/waiting-room/${roomCode}`, {
                            state: { roomCode, playerId, pseudo },
                        });
                    })
                    .catch((error) => {
                        console.error("Erreur lors de l'ajout du joueur:", error);
                    });
            })
            .catch((error) => {
                console.error("Erreur lors de la création de la room:", error);
            });
    }, []);

    return <div>Création de la room...</div>;
}

export default CreateRoom;
