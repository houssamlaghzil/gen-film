// GamePhase2.js
import React, { useState, useEffect } from 'react';
import { database } from '../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ref,
    get,
    set,
    update,
    onValue,
    off,
} from 'firebase/database';

console.log('GamePhase2.js loaded');

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
        console.log('Loading prompts from other players');

        const promptsRef = ref(database, `rooms/${roomCode}/prompts`);

        get(promptsRef)
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const promptsList = Object.entries(data)
                        .filter(([key]) => key !== playerId)
                        .map(([key, value]) => ({ playerId: key, ...value }));
                    setPrompts(promptsList);
                    console.log('Prompts received:', promptsList);
                } else {
                    console.error('No prompts found');
                }
            })
            .catch((error) => {
                console.error('Error fetching prompts:', error);
            });
    }, [roomCode, playerId]);

    useEffect(() => {
        // Listen to check if all players have finished Phase 2
        const playersRef = ref(database, `rooms/${roomCode}/players`);
        const handlePlayersValue = (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                const allFinished = Object.values(playersData).every(
                    (player) => player.hasFinishedPhase2
                );
                if (allFinished) {
                    console.log('All players have finished Phase 2');
                    // Proceed to calculate scores and assign the scenarist
                    calculateScoresAndProceed();
                } else {
                    console.log('Waiting for other players to finish Phase 2');
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
            const playersSnapshot = await get(playersRef);
            const playersData = playersSnapshot.val();

            const guessesRef = ref(database, `rooms/${roomCode}/guesses`);
            const guessesSnapshot = await get(guessesRef);
            const guessesData = guessesSnapshot.val();

            const promptsRef = ref(database, `rooms/${roomCode}/prompts`);
            const promptsSnapshot = await get(promptsRef);
            const promptsData = promptsSnapshot.val();

            // Calcul des scores pour la phase 2
            const updatedPlayers = {};
            for (let [pId, player] of Object.entries(playersData)) {
                let scorePhase2 = player.scorePhase2 || 0;

                // Les devinettes du joueur
                const playerGuesses = guessesData ? guessesData[pId] : {};

                // Vérifier les devinettes
                for (let [index, guess] of Object.entries(playerGuesses || {})) {
                    const promptKeys = Object.keys(promptsData);
                    const promptOwnerKey = promptKeys[index];
                    const promptOwner = promptsData[promptOwnerKey];
                    const actualFilm = promptOwner.film.toLowerCase().trim();
                    const guessLower = guess.toLowerCase().trim();

                    let points = 0;

                    // Déterminer les points en fonction de la popularité du film
                    const popularity = promptOwner.filmPopularity.toLowerCase();

                    if (popularity === 'niche') {
                        points = 25;
                    } else if (popularity === 'moins connu') {
                        points = 15;
                    } else {
                        points = 10;
                    }

                    if (guessLower === actualFilm) {
                        // Le joueur gagne des points
                        scorePhase2 += points;

                        // Le propriétaire du prompt gagne aussi des points
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

            // Mettre à jour les scores des joueurs dans Firebase
            for (let [pId, player] of Object.entries(updatedPlayers)) {
                const playerRef = ref(database, `rooms/${roomCode}/players/${pId}`);
                await update(playerRef, { scorePhase2: player.scorePhase2 });
            }


            // Attribuer le scénariste (joueur avec le plus de points en Phase 2)
            const maxScore = Math.max(
                ...Object.values(updatedPlayers).map((player) => player.scorePhase2 || 0)
            );
            const topPlayers = Object.values(updatedPlayers).filter(
                (player) => player.scorePhase2 === maxScore
            );
            const scenarist = topPlayers[0]; // En cas d'égalité, on prend le premier

            console.log('Scénariste désigné:', scenarist.pseudo);
            console.log('ID du scénariste:', scenarist.playerId);

            // Mettre à jour l'état de la room avec scenaristId
            const roomRef = ref(database, `rooms/${roomCode}`);
            await update(roomRef, { scenaristId: scenarist.playerId });

            // Mettre à jour la phase du jeu à 3
            await update(roomRef, { phase: 3 });

            // Naviguer les joueurs vers la Phase 3
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
        console.log('Submitting guesses:', guesses);

        try {
            // Save guesses in Firebase
            await set(ref(database, `rooms/${roomCode}/guesses/${playerId}`), guesses);

            // Update player's state to indicate they have finished Phase 2
            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                hasFinishedPhase2: true,
            });

            // Set waiting state
            setWaiting(true);
        } catch (error) {
            console.error('Error submitting guesses:', error);
        }
    };

    if (waiting) {
        return (
            <div>
                <h2>Phase 2: Waiting for Other Players</h2>
                <p>Your answers have been submitted. Waiting for other players to finish...</p>
            </div>
        );
    }

    return (
        <div>
            <h2>Phase 2: Guess the Films</h2>
            <p>
                Look at the images below and try to guess the film corresponding to each one.
                Enter your answers in the fields provided.
            </p>
            {prompts.length > 0 ? (
                prompts.map((promptData, index) => (
                    <div key={index}>
                        <h3>Image {index + 1}</h3>
                        <img src={promptData.imageUrl} alt={`Image ${index + 1}`} className={loaded ? 'loaded' : ''}
                             onLoad={() => setLoaded(true)}/>
                        <input
                            type="text"
                            placeholder="Your guess"
                            onChange={(e) => handleInputChange(e, index)}
                        />
                    </div>
                ))
            ) : (
                <p>Loading images...</p>
            )}
            <button
                onClick={handleSubmit}
                disabled={Object.keys(guesses).length !== prompts.length}
            >
                Submit My Answers
            </button>
        </div>
    );
}

export default GamePhase2;
