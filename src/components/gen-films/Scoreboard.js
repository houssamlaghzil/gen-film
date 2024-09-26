import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { useParams, useLocation } from 'react-router-dom';

console.log('Scoreboard.js chargé');

function Scoreboard() {
    const [players, setPlayers] = useState([]);
    const [mergedImage, setMergedImage] = useState('');
    const { roomCode } = useParams();
    const location = useLocation();
    const { pseudo } = location.state;

    useEffect(() => {
        console.log('useEffect - Chargement des scores des joueurs');
        console.log('roomCode:', roomCode);
        console.log('pseudo:', pseudo);

        const playersRef = ref(database, `rooms/${roomCode}/players`);
        onValue(playersRef, (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                const sortedPlayers = Object.values(playersData).sort((a, b) => b.totalScore - a.totalScore);
                setPlayers(sortedPlayers);
                console.log('Scores des joueurs chargés:', sortedPlayers);
            }
        });

        const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
        onValue(mergedImageRef, (snapshot) => {
            if (snapshot.exists()) {
                setMergedImage(snapshot.val().imageUrl);
                console.log('Image fusionnée chargée:', snapshot.val().imageUrl);
            }
        });
    }, [roomCode]);

    return (
        <div>
            <h2>Tableau des scores</h2>
            {mergedImage && <img src={mergedImage} alt="Image fusionnée" />}
            <ul>
                {players.map((player, index) => (
                    <li key={index}>
                        <p>{player.pseudo} - Score total: {player.totalScore}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Scoreboard;
