// firebaseUtils.js

import { database } from '../../../firebaseConfig';
import { ref, onValue, set, update, get } from 'firebase/database';
import { PLAYER_STATUSES } from './constants';

// Function to set up Firebase listeners
export const setupFirebaseListeners = (roomCode, userId, setPlayerData, setOpponentData, setOpponentId) => {
    console.log('Setting up Firebase listeners for user:', userId);

    const playersRef = ref(database, `wizardDuel/${roomCode}/players`);

    // Add current user to players list if not already present
    get(playersRef)
        .then((snapshot) => {
            const players = snapshot.val() || {};

            if (!players[userId]) {
                const updates = {};
                updates[userId] = true;
                update(playersRef, updates);
                console.log('Player added to players list:', userId);
            }

            const otherPlayerIds = Object.keys(players).filter((id) => id !== userId);
            if (otherPlayerIds.length > 0) {
                const opponentId = otherPlayerIds[0];
                setOpponentId(opponentId);
                console.log('Opponent ID set:', opponentId);

                // Set up opponentData listener
                const opponentRef = ref(database, `wizardDuel/${roomCode}/playerData/${opponentId}`);
                onValue(opponentRef, (snapshot) => {
                    const data = snapshot.val();
                    console.log('Opponent data updated:', data);
                    setOpponentData(data);
                });
            } else {
                console.log('Waiting for opponent to join...');
                // Listen for new players joining
                onValue(playersRef, (snapshot) => {
                    const players = snapshot.val() || {};
                    const newOtherPlayerIds = Object.keys(players).filter((id) => id !== userId);

                    if (newOtherPlayerIds.length > 0) {
                        const opponentId = newOtherPlayerIds[0];
                        setOpponentId(opponentId);
                        console.log('Opponent ID set:', opponentId);

                        // Set up opponentData listener
                        const opponentRef = ref(database, `wizardDuel/${roomCode}/playerData/${opponentId}`);
                        onValue(opponentRef, (snapshot) => {
                            const data = snapshot.val();
                            console.log('Opponent data updated:', data);
                            setOpponentData(data);
                        });
                    }
                });
            }
        })
        .catch((error) => {
            console.error('Error getting players:', error);
        });

    // Set up playerData listener
    const playerRef = ref(database, `wizardDuel/${roomCode}/playerData/${userId}`);
    onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log('Player data updated:', data);
            setPlayerData(data);
        }
    });
};

// Function to update player data in Firebase
export const updatePlayerData = async (roomCode, playerId, data) => {
    console.log('Updating player data:', data);
    await update(ref(database, `wizardDuel/${roomCode}/playerData/${playerId}`), data);
};

// Function to set player data in Firebase
export const setPlayerDataInDB = async (roomCode, playerId, data) => {
    console.log('Setting player data:', data);
    await set(ref(database, `wizardDuel/${roomCode}/playerData/${playerId}`), data);
};

console.log('firebaseUtils.js loaded');
