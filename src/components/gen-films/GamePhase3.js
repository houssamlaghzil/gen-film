// GamePhase3.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { database } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ref, get, update, onValue, off, set } from 'firebase/database';

console.log('GamePhase3.js chargé');

function GamePhase3() {
    const [isScenarist, setIsScenarist] = useState(false);
    const [films, setFilms] = useState([]);
    const [selectedFilms, setSelectedFilms] = useState([]);
    const [fusionPrompt, setFusionPrompt] = useState('');
    const [generatingImage, setGeneratingImage] = useState(false);
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    // Vérifier à plusieurs reprises si le scénariste est bien assigné
    const checkScenarist = async () => {
        const roomRef = ref(database, `rooms/${roomCode}`);
        const roomSnapshot = await get(roomRef);
        const roomData = roomSnapshot.val();
        if (roomData && roomData.scenaristId) {
            return roomData.scenaristId;
        }
        return null;
    };

    const determineScenarist = () => {
        checkScenarist().then((scenaristId) => {
            if (scenaristId) {
                if (scenaristId === playerId) {
                    setIsScenarist(true);
                }
                console.log('Scénariste trouvé:', scenaristId);
            } else {
                console.log('Aucun scénariste trouvé, nouvelle vérification dans 2 secondes...');
                setTimeout(determineScenarist, 2000); // Répéter toutes les 2 secondes
            }
        });
    };

    useEffect(() => {
        console.log('Détermination du scénariste');
        determineScenarist();

        const playersRef = ref(database, `rooms/${roomCode}/players`);
        get(playersRef)
            .then((playersSnapshot) => {
                const playersData = playersSnapshot.val();
                if (playersData) {
                    const filmsList = Object.values(playersData)
                        .map((player) => player.film)
                        .filter(Boolean);
                    setFilms(filmsList);
                    console.log('Films pour la fusion:', filmsList);
                }
            })
            .catch((error) => {
                console.error('Erreur lors de la récupération des joueurs:', error);
            });

        const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
        const handleMergedImageValue = (snapshot) => {
            if (snapshot.exists()) {
                console.log('Le scénariste a généré l\'image fusionnée');
                navigate(`/fusion-guessing/${roomCode}`, { state: { playerId, pseudo } });
            }
        };
        onValue(mergedImageRef, handleMergedImageValue);

        return () => {
            off(mergedImageRef, 'value', handleMergedImageValue);
        };
    }, [roomCode, playerId, navigate, pseudo]);

    const handleFilmSelection = (film) => {
        let updatedSelection = [...selectedFilms];
        if (updatedSelection.includes(film)) {
            updatedSelection = updatedSelection.filter((f) => f !== film);
        } else if (updatedSelection.length < 2) {
            updatedSelection.push(film);
        }
        setSelectedFilms(updatedSelection);
        console.log('Films sélectionnés pour la fusion:', updatedSelection);
    };

    const handleGenerateFusionImage = async () => {
        if (selectedFilms.length !== 2 || fusionPrompt.trim() === '') {
            alert('Veuillez sélectionner deux films et rédiger un prompt de fusion.');
            return;
        }

        setGeneratingImage(true);

        try {
            console.log('Génération de l\'image fusionnée avec le prompt:', fusionPrompt);

            const dalleResponse = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    prompt: fusionPrompt,
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

            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            await set(mergedImageRef, {
                imageUrl,
                prompt: fusionPrompt,
                films: selectedFilms,
                scenaristId: playerId,
            });

            setGeneratingImage(false);
        } catch (error) {
            console.error('Erreur lors de la génération de l\'image fusionnée:', error);
            setGeneratingImage(false);
        }
    };

    if (isScenarist) {
        return (
            <div>
                <h2>Phase 3 : Fusion des films</h2>
                <p>Vous êtes le scénariste ! Sélectionnez deux films et rédigez un prompt de fusion.</p>
                <ul>
                    {films.map((film, index) => (
                        <li key={index}>
                            <input
                                type="checkbox"
                                value={film}
                                onChange={() => handleFilmSelection(film)}
                                disabled={selectedFilms.length >= 2 && !selectedFilms.includes(film)}
                                checked={selectedFilms.includes(film)}
                            />
                            {film}
                        </li>
                    ))}
                </ul>
                {selectedFilms.length === 2 && (
                    <div>
                        <p>Rédigez une description détaillée de la fusion des films :</p>
                        <textarea
                            placeholder="Prompt de fusion"
                            value={fusionPrompt}
                            onChange={(e) => setFusionPrompt(e.target.value)}
                        />
                        <button onClick={handleGenerateFusionImage} disabled={generatingImage}>
                            {generatingImage ? 'Génération en cours...' : 'Générer l\'image'}
                        </button>
                    </div>
                )}
            </div>
        );
    } else {
        return (
            <div>
                <h2>Phase 3 : Fusion des films</h2>
                <p>En attente que le scénariste fusionne deux films...</p>
            </div>
        );
    }
}

export default GamePhase3;
