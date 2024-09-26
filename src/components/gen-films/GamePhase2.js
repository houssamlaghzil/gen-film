import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

console.log('GamePhase2.js chargé');

function GamePhase2() {
    const [prompts, setPrompts] = useState([]); // Ici, prompts contient les informations sur les images générées
    const [guesses, setGuesses] = useState({});
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;
    const navigate = useNavigate();

    useEffect(() => {
        console.log('Chargement des images générées pendant la Phase 1 pour les autres joueurs');
        const promptsRef = ref(database, `rooms/${roomCode}/prompts`);
        onValue(promptsRef, (snapshot) => {
            const promptsData = snapshot.val();
            if (promptsData) {
                // Ne pas afficher l'image du joueur actuel, seulement les autres joueurs
                const otherPrompts = Object.values(promptsData).filter(
                    (prompt) => prompt.pseudo !== pseudo
                );
                setPrompts(otherPrompts);
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

        try {
            // Enregistrer les devinettes du joueur en base de données
            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                guesses,
                hasFinished: true,
            });

            console.log('Devine soumise avec succès.');
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
