// FusionGuessing.js
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

console.log('FusionGuessing.js loaded');

function FusionGuessing() {
    const [mergedImageUrl, setMergedImageUrl] = useState('');
    const [guess1, setGuess1] = useState('');
    const [guess2, setGuess2] = useState('');
    const [waiting, setWaiting] = useState(false);
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    useEffect(() => {
        console.log('Loading merged image');

        const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);

        get(mergedImageRef)
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setMergedImageUrl(data.imageUrl);
                    console.log('Merged image loaded:', data.imageUrl);
                } else {
                    console.error('Merged image not found');
                }
            })
            .catch((error) => {
                console.error('Error loading merged image:', error);
            });
    }, [roomCode]);

    useEffect(() => {
        // Listen to check if all players have finished fusion guessing
        const playersRef = ref(database, `rooms/${roomCode}/players`);
        const handlePlayersValue = (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                const allFinished = Object.values(playersData).every(
                    (player) => player.hasFinishedFusionGuessing
                );
                if (allFinished) {
                    console.log('All players have finished fusion guessing');
                    // Proceed to calculate final scores
                    calculateFinalScores();
                } else {
                    console.log('Waiting for other players to finish fusion guessing');
                }
            }
        };
        onValue(playersRef, handlePlayersValue);

        return () => {
            off(playersRef, 'value', handlePlayersValue);
        };
    }, [roomCode]);

    const calculateFinalScores = async () => {
        console.log('Calculating final scores');
        try {
            const playersRef = ref(database, `rooms/${roomCode}/players`);
            const playersSnapshot = await get(playersRef);
            const playersData = playersSnapshot.val();

            const fusionGuessesRef = ref(database, `rooms/${roomCode}/fusionGuesses`);
            const fusionGuessesSnapshot = await get(fusionGuessesRef);
            const fusionGuessesData = fusionGuessesSnapshot.val();

            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            const mergedImageSnapshot = await get(mergedImageRef);
            const mergedImageData = mergedImageSnapshot.val();
            const fusedFilms = mergedImageData.films.map((film) =>
                film.toLowerCase().trim()
            );

            // Calculate scores for fusion guessing
            const updatedPlayers = {};
            for (let [pId, player] of Object.entries(playersData)) {
                let scorePhase3 = player.scorePhase3 || 0;
                let bonusPoints = player.bonusPoints || 0;

                // Skip the scenarist
                if (pId === mergedImageData.scenaristId) {
                    continue;
                }

                const playerGuesses = fusionGuessesData ? fusionGuessesData[pId] : {};
                const guess1 = playerGuesses.guess1.toLowerCase().trim();
                const guess2 = playerGuesses.guess2.toLowerCase().trim();

                let correctGuesses = 0;
                if (fusedFilms.includes(guess1)) correctGuesses += 1;
                if (fusedFilms.includes(guess2)) correctGuesses += 1;

                if (correctGuesses === 1) {
                    scorePhase3 += 5;
                } else if (correctGuesses === 2) {
                    scorePhase3 += 10;
                }

                updatedPlayers[pId] = {
                    ...player,
                    scorePhase3,
                    bonusPoints,
                };
            }

            // Update players' scores in Firebase
            for (let [pId, player] of Object.entries(updatedPlayers)) {
                const playerRef = ref(database, `rooms/${roomCode}/players/${pId}`);
                await update(playerRef, {
                    scorePhase3: player.scorePhase3,
                    bonusPoints: player.bonusPoints,
                });
            }

            // Update scenarist's points
            const scenaristId = mergedImageData.scenaristId;
            let scenaristScore = playersData[scenaristId].scorePhase3 || 0;
            const numPlayersGuessedBoth = Object.values(fusionGuessesData).reduce(
                (count, guesses) => {
                    const g1 = guesses.guess1.toLowerCase().trim();
                    const g2 = guesses.guess2.toLowerCase().trim();
                    if (
                        fusedFilms.includes(g1) &&
                        fusedFilms.includes(g2) &&
                        guesses.playerId !== scenaristId
                    ) {
                        return count + 1;
                    }
                    return count;
                },
                0
            );
            scenaristScore += 10 * numPlayersGuessedBoth;

            const scenaristRef = ref(database, `rooms/${roomCode}/players/${scenaristId}`);
            await update(scenaristRef, { scorePhase3: scenaristScore });

            // Update game phase to final
            const roomRef = ref(database, `rooms/${roomCode}`);
            await update(roomRef, { phase: 'final' });

            // Navigate to scoreboard
            navigate(`/scoreboard/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Error calculating final scores:', error);
        }
    };

    const handleSubmit = async () => {
        console.log('Submitting fusion guesses:', { guess1, guess2 });

        try {
            // Save guesses in Firebase
            await set(ref(database, `rooms/${roomCode}/fusionGuesses/${playerId}`), {
                guess1,
                guess2,
            });

            // Update player's state to indicate they have finished fusion guessing
            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                hasFinishedFusionGuessing: true,
            });

            // Set waiting state
            setWaiting(true);
        } catch (error) {
            console.error('Error submitting fusion guesses:', error);
        }
    };

    if (waiting) {
        return (
            <div>
                <h2>Fusion Guessing: Waiting for Other Players</h2>
                <p>Your answers have been submitted. Waiting for other players to finish...</p>
            </div>
        );
    }

    return (
        <div>
            <h2>Guess the Fused Films</h2>
            <p>
                Look at the fused image below and try to guess the two films that were fused.
                Enter your guesses in the fields provided.
            </p>
            {mergedImageUrl ? (
                <div>
                    <img src={mergedImageUrl} alt="Fused Image" />
                    <div>
                        <input
                            type="text"
                            placeholder="First Film"
                            value={guess1}
                            onChange={(e) => setGuess1(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Second Film"
                            value={guess2}
                            onChange={(e) => setGuess2(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!guess1.trim() || !guess2.trim()}
                    >
                        Submit My Answers
                    </button>
                </div>
            ) : (
                <p>Loading fused image...</p>
            )}
        </div>
    );
}

export default FusionGuessing;
