// Scoreboard.js
import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { useParams, useLocation } from 'react-router-dom';
import { ref, get } from 'firebase/database';

console.log('Scoreboard.js chargé');

function Scoreboard() {
    const [players, setPlayers] = useState([]);
    const [prompts, setPrompts] = useState([]); // Ajout de cette ligne
    const [mergedImageUrl, setMergedImageUrl] = useState('');
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    useEffect(() => {
        console.log('Chargement des scores pour la room:', roomCode);

        const fetchScoresAndPrompts = async () => {
            try {
                const playersRef = ref(database, `rooms/${roomCode}/players`);
                const playersSnapshot = await get(playersRef);
                const playersData = playersSnapshot.val();

                const finalPlayersList = Object.values(playersData).map((player) => ({
                    pseudo: player.pseudo,
                    scorePhase2: player.scorePhase2 || 0,
                    scorePhase3: player.scorePhase3 || 0,
                    bonusPoints: player.bonusPoints || 0,
                    totalScore:
                        (player.scorePhase2 || 0) +
                        (player.scorePhase3 || 0) +
                        (player.bonusPoints || 0),
                }));

                setPlayers(finalPlayersList);
                console.log('Scores finaux:', finalPlayersList);

                // Récupérer les prompts et images
                const promptsRef = ref(database, `rooms/${roomCode}/prompts`);
                const promptsSnapshot = await get(promptsRef);
                const promptsData = promptsSnapshot.val();
                if (promptsData) {
                    const promptsList = Object.values(promptsData);
                    setPrompts(promptsList);
                    console.log('Prompts reçus:', promptsList);
                }

                // Récupérer l'image fusionnée
                const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
                const mergedImageSnapshot = await get(mergedImageRef);
                const mergedImageData = mergedImageSnapshot.val();
                if (mergedImageData) {
                    setMergedImageUrl(mergedImageData.imageUrl);
                    console.log('Image fusionnée chargée:', mergedImageData.imageUrl);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des scores et des prompts:', error);
            }
        };

        fetchScoresAndPrompts();
    }, [roomCode]);

    return (
        <div>
            <h2>Tableau des Scores</h2>
            <table>
                <thead>
                <tr>
                    <th>Joueur</th>
                    <th>Phase 2</th>
                    <th>Phase 3</th>
                    <th>Bonus</th>
                    <th>Total</th>
                </tr>
                </thead>
                <tbody>
                {players.map((player, index) => (
                    <tr key={index}>
                        <td>{player.pseudo}</td>
                        <td>{player.scorePhase2}</td>
                        <td>{player.scorePhase3}</td>
                        <td>{player.bonusPoints}</td>
                        <td>{player.totalScore}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            {mergedImageUrl && (
                <div>
                    <h3>Image Fusionnée</h3>
                    <img src={mergedImageUrl} alt="Image Fusionnée" />
                </div>
            )}
            <div>
                <h3>Images Générées pendant la Partie</h3>
                {prompts.map((promptData, index) => (
                    <div key={index}>
                        <h4>{promptData.pseudo}</h4>
                        <img src={promptData.imageUrl} alt={`Image ${index + 1}`} />
                        <p>Prompt : {promptData.prompt}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Scoreboard;
