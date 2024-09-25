// WaitingRoom.js
import React, {useState, useEffect} from 'react';
import {database} from '../../firebaseConfig';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import {ref, onValue, off, update} from 'firebase/database';

console.log('WaitingRoom.js chargé');

function WaitingRoom() {
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();
    const {roomCode} = useParams();
    const location = useLocation();
    const {playerId, pseudo} = location.state;
    const [gameMode, setGameMode] = useState('');

    useEffect(() => {
        console.log("Salle d'attente pour la room:", roomCode);
        const playersRef = ref(database, `rooms/${roomCode}/players`);

        // Écouter les changements dans la liste des joueurs
        const unsubscribe = onValue(playersRef, (snapshot) => {
            const data = snapshot.val();
            const playersList = data ? Object.values(data) : [];
            setPlayers(playersList);
            console.log('Liste des joueurs mise à jour:', playersList);
        });

        return () => {
            off(playersRef);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    /*    const startGame = () => {
            console.log('Démarrage de la partie pour la room:', roomCode);
            const roomRef = ref(database, `rooms/${roomCode}`);
            update(roomRef, {gameStarted: true})
                .then(() => {
                    navigate(`/game/phase1/${roomCode}`, {state: {playerId, pseudo}});
                })
                .catch((error) => {
                    console.error("Erreur lors du démarrage de la partie:", error);
                });
        };*/

    //en fonction du mode de jeu choisi lors du lancement de la partie lancer le bon composant
    const startGame = () => {
        if (gameMode === 'senariste') {
            console.log('Démarrage de la partie pour la room:', roomCode);
            const roomRef = ref(database, `rooms/${roomCode}`);
            update(roomRef, {gameStarted: true})
                .then(() => {
                    navigate(`/game/phase1/${roomCode}`, {state: {playerId, pseudo}});
                })
                .catch((error) => {
                    console.error("Erreur lors du démarrage de la partie:", error);
                });
        } else {
            console.log('Démarrage de la partie pour la room:', roomCode, 'avec le mode de jeu:', gameMode);
            const roomRef = ref(database, `rooms/${gameMode}/${roomCode}`);
            update(roomRef, {gameStarted: true, gameMode})
                .then(() => {
                    navigate(`/game/${gameMode}/${roomCode}`, {state: {playerId, pseudo, gameMode}});
                })
                .catch((error) => {
                    console.error("Erreur lors du démarrage de la partie:", error);
                });
        }
    }
    

    return (
        <div>
            <h2>Code de la room: {roomCode}</h2>
            <h3>Joueurs connectés :</h3>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>{player.pseudo}</li>
                ))}
            </ul>

            <select onChange={(e) => setGameMode(e.target.value)}>
                <option value="senariste">Sénariste</option>
                <option value="combat_de_sorcier">Combat de Sorcier</option>
            </select>

            <h1>Choix du jeu</h1>


            {players.length >= 3 && (
                <button onClick={startGame}>Commencer la partie</button>
            )}
            {players.length < 3 && <p>En attente d'autres joueurs...</p>}
        </div>
    );
}

export default WaitingRoom;
