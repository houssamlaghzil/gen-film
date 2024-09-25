// JoinRoom.js
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { database } from '../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { ref, get, child, set } from 'firebase/database';

console.log('JoinRoom.js chargé');

function JoinRoom() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pseudo, roomCode } = location.state;
    const playerId = uuidv4();

    const hasExecutedRef = useRef(false);

    useEffect(() => {
        if (hasExecutedRef.current) {
            console.log('useEffect déjà exécuté, on ne fait rien');
            return;
        }
        hasExecutedRef.current = true;

        console.log('Tentative de rejoindre la room:', roomCode);

        const roomRef = ref(database);
        get(child(roomRef, `rooms/${roomCode}`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    // La room existe, ajouter le joueur
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
    }, []);

    return <div>Connexion à la room...</div>;
}

export default JoinRoom;
