// FusionPrompt.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { database } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ref, set, update, get } from 'firebase/database';

console.log('FusionPrompt.js chargé');

function FusionPrompt() {
    const [mergedPrompt, setMergedPrompt] = useState('');
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo, selectedFilms } = location.state;

    useEffect(() => {
        console.log('Création du prompt fusionné pour les films:', selectedFilms);
        const createMergedPrompt = async () => {
            try {
                // Générer une description d'image détaillée pour DALL·E
                const response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'user',
                                content: `Crée une description d'image détaillée en anglais pour une fusion des films ${selectedFilms.join(
                                    ' et '
                                )}. La description doit être adaptée pour DALL·E.`,
                            },
                        ],
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                        },
                    }
                );

                const generatedPrompt = response.data.choices[0].message.content;
                console.log('Prompt fusionné généré:', generatedPrompt);

                setMergedPrompt(generatedPrompt);
            } catch (error) {
                console.error('Erreur lors de la création du prompt fusionné:', error);
            }
        };

        createMergedPrompt();
    }, [selectedFilms]);

    const handleSubmit = async () => {
        console.log('Envoi du prompt fusionné pour génération d\'image');
        try {
            // Appeler l'API DALL·E pour générer l'image fusionnée
            const dalleResponse = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    prompt: mergedPrompt,
                    n: 1,
                    size: '256x256',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                    },
                }
            );

            const imageUrl = dalleResponse.data.data[0].url;
            console.log('Image fusionnée générée URL:', imageUrl);

            // Enregistrer l'image fusionnée dans Firebase
            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            await set(mergedImageRef, {
                imageUrl,
                prompt: mergedPrompt,
            });

            // Mettre à jour les scores du scénariste
            const playersRef = ref(database, `rooms/${roomCode}/players`);
            const playersSnapshot = await get(playersRef);
            const playersData = playersSnapshot.val();

            const numPlayers = Object.keys(playersData).length - 1; // Exclure le scénariste

            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                scorePhase3: 0, // Le scénariste ne gagne pas de points ici
            });

            navigate(`/scoreboard/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du prompt fusionné:', error);
        }
    };

    return (
        <div>
            <h2>Prompt Fusionné</h2>
            <p>{mergedPrompt}</p>
            <button onClick={handleSubmit}>Envoyer le prompt fusionné</button>
        </div>
    );
}

export default FusionPrompt;
