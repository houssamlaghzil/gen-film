import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { database } from '../../firebaseConfig';
import { ref, set, onValue } from 'firebase/database';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

console.log('FusionPrompt.js chargé');

function FusionPrompt() {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;
    const navigate = useNavigate();

    useEffect(() => {
        console.log('useEffect - FusionPrompt loaded');
        console.log('roomCode:', roomCode);
        console.log('playerId:', playerId);
        console.log('pseudo:', pseudo);
    }, [roomCode, playerId, pseudo]);

    const handleGenerateImage = async () => {
        console.log('Génération de l\'image avec prompt:', prompt);

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    prompt,
                    n: 1,
                    size: '256x256',
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const imageUrl = response.data.data[0].url;
            setImageUrl(imageUrl);
            console.log('Image générée avec succès:', imageUrl);

            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            await set(mergedImageRef, {
                imageUrl,
                prompt,
                films: ['Film1', 'Film2'], // Exemples de films
                scenaristPseudo: pseudo,
            });

            console.log('Données d\'image fusionnées enregistrées dans Firebase.');
            navigate(`/fusion-guessing/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Erreur lors de la génération d\'image:', error);
        }
    };

    return (
        <div>
            <h2>Fusion des films</h2>
            <textarea
                value={prompt}
                onChange={(e) => {
                    setPrompt(e.target.value);
                    console.log('Prompt updated:', e.target.value);
                }}
                placeholder="Entrez un prompt pour la fusion"
            />
            <button onClick={handleGenerateImage}>Générer l'image</button>
            {imageUrl && <img src={imageUrl} alt="Image fusionnée" />}
        </div>
    );
}

export default FusionPrompt;
