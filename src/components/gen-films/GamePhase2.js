// GamePhase2.js

import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ref, get, set, update, onValue, off } from 'firebase/database';

console.log('GamePhase2.js chargé');

function GamePhase2() {
    const [loaded, setLoaded] = useState(false);
    const [prompts, setPrompts] = useState([]);
    const [guesses, setGuesses] = useState({});
    const [waiting, setWaiting] = useState(false);

    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    useEffect(() => {
        console.log('Récupération des prompts des autres joueurs');

        const promptsRef = ref(database, `rooms/${roomCode}/prompts`);

        const handlePromptsChange = (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const promptsList = Object.entries(data)
                    .filter(([key]) => key !== playerId)
                    .map(([key, value]) => ({ playerId: key, ...value }));
                setPrompts(promptsList);
                console.log('Prompts reçus:', promptsList);
            } else {
                console.error('Aucun prompt trouvé');
                setPrompts([]);
            }
        };

        onValue(promptsRef, handlePromptsChange);

        return () => {
            off(promptsRef, 'value', handlePromptsChange);
        };
    }, [roomCode, playerId]);

    useEffect(() => {
        const playersRef = ref(database, `rooms/${roomCode}/players`);

        const handlePlayersValue = (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                const allFinished = Object.values(playersData).every(
                    (player) => player.hasFinishedPhase2
                );
                if (allFinished) {
                    console.log('Tous les joueurs ont terminé la Phase 2');
                    calculateScoresAndProceed();
                } else {
                    console.log('En attente des autres joueurs');
                }
            }
        };

        onValue(playersRef, handlePlayersValue);

        return () => {
            off(playersRef, 'value', handlePlayersValue);
        };
    }, [roomCode]);

    const calculateScoresAndProceed = async () => {
        console.log('Calcul des scores pour la Phase 2');
        try {
            const playersRef = ref(database, `rooms/${roomCode}/players`);
            const guessesRef = ref(database, `rooms/${roomCode}/guesses`);
            const promptsRef = ref(database, `rooms/${roomCode}/prompts`);

            const [playersSnapshot, guessesSnapshot, promptsSnapshot] = await Promise.all([
                get(playersRef),
                get(guessesRef),
                get(promptsRef),
            ]);

            const playersData = playersSnapshot.val();
            const guessesData = guessesSnapshot.val();
            const promptsData = promptsSnapshot.val();

            const updatedPlayers = {};

            for (let [pId, player] of Object.entries(playersData)) {
                let scorePhase2 = player.scorePhase2 || 0;

                const playerGuesses = guessesData ? guessesData[pId] : {};

                for (let [index, guess] of Object.entries(playerGuesses || {})) {
                    const promptKeys = Object.keys(promptsData);
                    const promptOwnerKey = promptKeys[index];
                    const promptOwner = promptsData[promptOwnerKey];
                    const actualFilm = promptOwner.film.toLowerCase().trim();
                    const guessLower = guess.toLowerCase().trim();

                    let points = 0;
                    const popularity = promptOwner.filmPopularity.toLowerCase();

                    if (popularity === 'niche') {
                        points = 25;
                    } else if (popularity === 'film connu') {
                        points = 15;
                    } else {
                        points = 10;
                    }

                    if (guessLower === actualFilm) {
                        scorePhase2 += points;
                        const ownerId = promptOwnerKey;
                        updatedPlayers[ownerId] = updatedPlayers[ownerId] || {
                            ...playersData[ownerId],
                            playerId: ownerId,
                            scorePhase2: playersData[ownerId].scorePhase2 || 0,
                        };
                        updatedPlayers[ownerId].scorePhase2 += points;
                    }
                }

                updatedPlayers[pId] = updatedPlayers[pId] || {
                    ...player,
                    playerId: pId,
                    scorePhase2,
                };
            }

            console.log('Joueurs mis à jour:', updatedPlayers);

            // Mettre à jour les scores des joueurs
            for (let [pId, player] of Object.entries(updatedPlayers)) {
                const playerRef = ref(database, `rooms/${roomCode}/players/${pId}`);
                await update(playerRef, { scorePhase2: player.scorePhase2 });
            }

            // Trouver le maximum de points
            const maxScore = Math.max(
                ...Object.values(updatedPlayers).map((player) => player.scorePhase2 || 0)
            );
            // Trouver les joueurs ayant le score maximal
            const topPlayers = Object.values(updatedPlayers).filter(
                (player) => player.scorePhase2 === maxScore
            );

            // Si plusieurs joueurs sont ex aequo, choisir au hasard
            const scenarist =
                topPlayers.length > 1
                    ? topPlayers[Math.floor(Math.random() * topPlayers.length)]
                    : topPlayers[0];

            console.log('Scénariste désigné:', scenarist.pseudo);
            console.log('ID du scénariste:', scenarist.playerId);

            const roomRef = ref(database, `rooms/${roomCode}`);
            await update(roomRef, { scenaristId: scenarist.playerId, phase: 3 });

            navigate(`/game/phase3/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Erreur lors du calcul des scores:', error);
        }
    };

    const handleInputChange = (e, index) => {
        const newGuesses = { ...guesses };
        newGuesses[index] = e.target.value;
        setGuesses(newGuesses);
    };

    const handleSubmit = async () => {
        console.log('Soumission des devinettes:', guesses);

        try {
            await set(ref(database, `rooms/${roomCode}/guesses/${playerId}`), guesses);
            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                hasFinishedPhase2: true,
            });
            setWaiting(true);
        } catch (error) {
            console.error('Erreur lors de la soumission des devinettes:', error);
        }
    };

    if (waiting) {
        return (
            <div>
                <h2>Phase 2 : En attente des autres joueurs</h2>
                <p>Vos réponses ont été soumises. En attente des autres joueurs...</p>
            </div>
        );
    }

    return (
        <div>
            <h2>Phase 2 : Devinez les films</h2>
            <p>
                Regardez les images ci-dessous et essayez de deviner le film correspondant à chacune.
                Saisissez vos réponses dans les champs prévus.
            </p>
            {prompts.map((promptData, index) => (
                <div key={index}>
                    <h3>Image {index + 1}</h3>
                    <img
                        src={promptData.imageUrl}
                        alt={`Image ${index + 1}`}
                    />
                    <input
                        type="text"
                        placeholder="Votre devinette"
                        onChange={(e) => handleInputChange(e, index)}
                    />
                </div>
            ))}
            <button
                onClick={handleSubmit}
                disabled={Object.keys(guesses).length !== prompts.length}
            >
                Soumettre mes réponses
            </button>
        </div>
    );
}

export default GamePhase2;
