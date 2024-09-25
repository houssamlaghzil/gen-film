import { ref, get, child, set } from 'firebase/database';
import { database } from '../../firebaseConfig'; // Adjust the path based on your project structure

export const joinRoom = (roomCode, pseudo, playerId, navigate) => {
    const roomRef = ref(database);
    get(child(roomRef, `rooms/${roomCode}`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                const players = snapshot.val().players || {};

                // Check if the player already exists in the room
                if (Object.values(players).some(player => player.pseudo === pseudo)) {
                    console.error("Ce joueur est déjà dans la room.");
                    alert("Ce pseudo est déjà utilisé dans cette room.");
                    return;
                }

                // Add player to the room
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
                        // Navigate to the waiting room after successful addition
                        navigate(`/waiting-room/${roomCode}`, {
                            state: { roomCode, playerId, pseudo },
                        });
                    })
                    .catch((error) => {
                        console.error("Erreur lors de l'ajout du joueur:", error);
                    });
            } else {
                console.error("La room n'existe pas");
                alert("La room n'existe pas.");
                navigate('/'); // Navigate to home if room doesn't exist
            }
        })
        .catch((error) => {
            console.error("Erreur lors de la vérification de la room:", error);
        });
};
