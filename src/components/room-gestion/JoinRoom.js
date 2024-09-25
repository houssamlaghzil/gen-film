// JoinRoom.js
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { database } from '../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { ref, get, child, set } from 'firebase/database';

export const joinRoom = (roomCode, pseudo, playerId, navigate) => {
    const roomRef = ref(database);
    get(child(roomRef, `rooms/${roomCode}`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                const players = snapshot.val().players || {};

                // Vérifie si le joueur existe déjà dans la room
                if (Object.values(players).some(player => player.pseudo === pseudo)) {
                    console.error("Ce joueur est déjà dans la room.");
                    alert("Ce joueur est déjà dans la room.");
                    return;
                }

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
            } else {
                console.error("La room n'existe pas");
                alert("La room n'existe pas");
                navigate('/');
            }
        })
        .catch((error) => {
            console.error("Erreur lors de la vérification de la room:", error);
        });
};

// Le composant JoinRoom
function JoinRoom() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pseudo, roomCode } = location.state;
    const playerId = Date.now() + uuidv4(); // ID unique basé sur le timestamp

    const hasExecutedRef = useRef(false);

    useEffect(() => {
        if (hasExecutedRef.current) {
            console.log('useEffect déjà exécuté, on ne fait rien');
            return;
        }
        hasExecutedRef.current = true;

        joinRoom(roomCode, pseudo, playerId, navigate);
    }, [navigate, pseudo, roomCode]);

    return <div>Connexion à la room...</div>;
}

export default JoinRoom;
