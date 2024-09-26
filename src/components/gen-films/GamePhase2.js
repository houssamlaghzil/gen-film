import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, onValue, update, get } from 'firebase/database';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

console.log('GamePhase2.js chargé');

function GamePhase2() {
    const [prompts, setPrompts] = useState([]); // Contient les informations sur les images générées
    const [guesses, setGuesses] = useState({});
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;
    const navigate = useNavigate();
    const [correctPrompts, setCorrectPrompts] = useState([]); // Ajout pour stocker les prompts corrects

    useEffect(() => {
        console.log('Chargement des images générées pendant la Phase 1 pour les autres joueurs');
        const promptsRef = ref(database, `rooms/${roomCode}/prompts`);
        onValue(promptsRef, (snapshot) => {
            const promptsData = snapshot.val();
            if (promptsData) {
                const otherPrompts = Object.values(promptsData).filter(
                    (prompt) => prompt.pseudo !== pseudo
                );
                setPrompts(otherPrompts);
                setCorrectPrompts(otherPrompts.map(prompt => prompt.film)); // Stocker les films corrects
                console.log('Images reçues:', otherPrompts);
            }
        });
    }, [roomCode, pseudo]);

    const handleGuessChange = (index, guess) => {
        setGuesses({ ...guesses, [index]: guess });
        console.log('Devine mise à jour pour l\'image:', guesses);
    };

    const handleSubmit = async () => {
        console.log('Soumission des devinettes pour la Phase 2:', guesses);

        // Calcul des scores pour la phase 2
        let score = 0;
        correctPrompts.forEach((correctFilm, index) => {
            if (guesses[index] === correctFilm) {
                score += 1;
            }
        });

        try {
            // Mise à jour du score en base de données
            const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
            const currentPlayerData = (await get(playerRef)).val();
            await update(playerRef, {
                guesses, // Enregistrer les devinettes du joueur
                scorePhase2: score, // Enregistrer le score pour la phase 2
                totalScore: currentPlayerData.totalScore + score, // Mettre à jour le score total
                hasFinished: true,
            });

            console.log('Devine soumise avec succès, score mis à jour.');
            navigate(`/game/phase3/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Erreur lors de la soumission des devinettes:', error);
        }
    };

    return (
        <div>
            <h2>Phase 2 : Devinez les films à partir des images</h2>
            <ul>
                {prompts.map((prompt, index) => (
                    <li key={index}>
                        <p>Image générée :</p>
                        <img src={prompt.imageUrl} alt={`Image générée par ${prompt.pseudo}`} width="256" height="256" />
                        <input
                            type="text"
                            placeholder="Votre devinette"
                            value={guesses[index] || ''}
                            onChange={(e) => handleGuessChange(index, e.target.value)}
                        />
                    </li>
                ))}
            </ul>
            <button onClick={handleSubmit}>Soumettre les devinettes</button>
        </div>
    );
}

export default GamePhase2;
