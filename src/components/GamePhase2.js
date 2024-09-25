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
    // State variables
    const [loaded, setLoaded] = useState(false);
    const [prompts, setPrompts] = useState([]);
    const [guesses, setGuesses] = useState({});
    const [waiting, setWaiting] = useState(false);

    // React Router hooks
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    // Effect to listen for prompts from other players
    useEffect(() => {
        console.log('Listening for prompts from other players');

        // Reference to the prompts in the database
        const promptsRef = ref(database, `rooms/${roomCode}/prompts`);

        // Callback function to handle data changes
        const handlePromptsChange = (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Transform the data into a list and exclude the current player's prompts
                const promptsList = Object.entries(data)
                    .filter(([key]) => key !== playerId)
                    .map(([key, value]) => ({ playerId: key, ...value }));
                setPrompts(promptsList);
                console.log('Prompts received:', promptsList);
            } else {
                console.error('No prompts found');
                setPrompts([]); // Clear prompts if none are found
            }
        };

        // Set up a real-time listener for the prompts
        onValue(promptsRef, handlePromptsChange);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            off(promptsRef, 'value', handlePromptsChange);
        };
    }, [roomCode, playerId]);

    // Effect to listen for changes in players' completion status
    useEffect(() => {
        // Reference to the players in the database
        const playersRef = ref(database, `rooms/${roomCode}/players`);

        // Callback function to handle data changes
        const handlePlayersValue = (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                // Check if all players have finished Phase 2
                const allFinished = Object.values(playersData).every(
                    (player) => player.hasFinishedPhase2
                );
                if (allFinished) {
                    console.log('All players have finished Phase 2');
                    // Proceed to calculate scores and move to the next phase
                    calculateScoresAndProceed();
                } else {
                    checkLoaded();
                    console.log('Waiting for other players to finish Phase 2');
                }
            }
        };

        // Set up a real-time listener for the players
        onValue(playersRef, handlePlayersValue);

        // Cleanup function to remove the listener
        return () => {
            off(playersRef, 'value', handlePlayersValue);
        };
    }, [roomCode]);

    // Function to calculate scores and proceed to the next phase
    const calculateScoresAndProceed = async () => {
        console.log('Calculating scores for Phase 2');
        try {
            // References to various paths in the database
            const playersRef = ref(database, `rooms/${roomCode}/players`);
            const guessesRef = ref(database, `rooms/${roomCode}/guesses`);
            const promptsRef = ref(database, `rooms/${roomCode}/prompts`);

            // Fetch data from the database
            const [playersSnapshot, guessesSnapshot, promptsSnapshot] = await Promise.all([
                get(playersRef),
                get(guessesRef),
                get(promptsRef),
            ]);

            const playersData = playersSnapshot.val();
            const guessesData = guessesSnapshot.val();
            const promptsData = promptsSnapshot.val();

            // Object to store updated players' scores
            const updatedPlayers = {};

            // Calculate scores for each player
            for (let [pId, player] of Object.entries(playersData)) {
                let scorePhase2 = player.scorePhase2 || 0;

                // The guesses made by the player
                const playerGuesses = guessesData ? guessesData[pId] : {};

                // Verify each guess
                for (let [index, guess] of Object.entries(playerGuesses || {})) {
                    const promptKeys = Object.keys(promptsData);
                    const promptOwnerKey = promptKeys[index];
                    const promptOwner = promptsData[promptOwnerKey];
                    const actualFilm = promptOwner.film.toLowerCase().trim();
                    const guessLower = guess.toLowerCase().trim();

                    let points = 0;

                    // Determine points based on film popularity
                    const popularity = promptOwner.filmPopularity.toLowerCase();

                    if (popularity === 'niche') {
                        points = 25;
                    } else if (popularity === 'moins connu') {
                        points = 15;
                    } else {
                        points = 10;
                    }

                    if (guessLower === actualFilm) {
                        // Player gains points for a correct guess
                        scorePhase2 += points;

                        // Owner of the prompt also gains points
                        const ownerId = promptOwnerKey;
                        updatedPlayers[ownerId] = updatedPlayers[ownerId] || {
                            ...playersData[ownerId],
                            playerId: ownerId,
                            scorePhase2: playersData[ownerId].scorePhase2 || 0,
                        };
                        updatedPlayers[ownerId].scorePhase2 += points;
                    }
                }

                // Update the player's score
                updatedPlayers[pId] = updatedPlayers[pId] || {
                    ...player,
                    playerId: pId,
                    scorePhase2,
                };
            }

            console.log('Updated players:', updatedPlayers);

            // Update players' scores in Firebase
            for (let [pId, player] of Object.entries(updatedPlayers)) {
                const playerRef = ref(database, `rooms/${roomCode}/players/${pId}`);
                await update(playerRef, { scorePhase2: player.scorePhase2 });
            }

            // Determine the scenarist (player with the highest score)
            const maxScore = Math.max(
                ...Object.values(updatedPlayers).map((player) => player.scorePhase2 || 0)
            );
            const topPlayers = Object.values(updatedPlayers).filter(
                (player) => player.scorePhase2 === maxScore
            );
            const scenarist = topPlayers[0]; // In case of a tie, select the first player

            console.log('Designated scenarist:', scenarist.pseudo);
            console.log('Scenarist ID:', scenarist.playerId);

            // Update the room state with the scenarist ID and advance to Phase 3
            const roomRef = ref(database, `rooms/${roomCode}`);
            await update(roomRef, { scenaristId: scenarist.playerId, phase: 3 });

            // Navigate players to Phase 3
            navigate(`/game/phase3/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Error calculating scores:', error);
        }
    };

    // Handler for input changes in the guess fields
    const handleInputChange = (e, index) => {
        const newGuesses = { ...guesses };
        newGuesses[index] = e.target.value;
        setGuesses(newGuesses);
    };

    // Handler for submitting guesses
    const handleSubmit = async () => {
        console.log('Submitting guesses:', guesses);

        try {
            // Save guesses in Firebase
            await set(ref(database, `rooms/${roomCode}/guesses/${playerId}`), guesses);

            // Update player's state to indicate completion of Phase 2
            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                hasFinishedPhase2: true,
            });

            // Set waiting state to true
            setWaiting(true);
        } catch (error) {
            console.error('Error submitting guesses:', error);
        }
    };

    // Check if the player is waiting for others
    if (waiting) {
        return (
            <div>
                <h2>Phase 2: Waiting for Other Players</h2>
                <p>Your answers have been submitted. Waiting for other players to finish...</p>
            </div>
        );
    }

    // Function to check if images are loaded
    function checkLoaded() {
        let loaded = true;
        prompts.forEach((promptData) => {
            if (!promptData.imageUrl) {
                loaded = false;
            }
        });
        return loaded;
    }

    // Render the component
    return (
        <div>
            <h2>Phase 2: Guess the Films</h2>
            <p>
                Look at the images below and try to guess the film corresponding to each one.
                Enter your answers in the fields provided.
            </p>
            {/* Display all images and listen for new ones added to the database */}
            {prompts.map((promptData, index) => (
                <div key={index}>
                    <h3>Image {index + 1}</h3>
                    <img
                        src={promptData.imageUrl}
                        alt={`Image ${index + 1}`}
                        className={checkLoaded() ? 'loaded' : ''}
                        onLoad={() => setLoaded(true)}
                    />
                    <input
                        type="text"
                        placeholder="Your guess"
                        onChange={(e) => handleInputChange(e, index)}
                    />
                </div>
            ))}
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
