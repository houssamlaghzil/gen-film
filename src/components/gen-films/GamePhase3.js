// GamePhase3.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { database } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ref,
    get,
    update,
    onValue,
    off,
    set,
} from 'firebase/database';

console.log('GamePhase3.js loaded');

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

    useEffect(() => {
        console.log('Determining the scenarist');

        // Get scenaristId from room data
        const roomRef = ref(database, `rooms/${roomCode}`);

        get(roomRef)
            .then((snapshot) => {
                const roomData = snapshot.val();
                if (roomData) {
                    const scenaristId = roomData.scenaristId;
                    if (scenaristId === playerId) {
                        setIsScenarist(true);
                    }

                    // Fetch films from players
                    const playersRef = ref(database, `rooms/${roomCode}/players`);
                    get(playersRef)
                        .then((playersSnapshot) => {
                            const playersData = playersSnapshot.val();
                            if (playersData) {
                                const playersArray = Object.entries(playersData).map(
                                    ([key, value]) => ({ playerId: key, ...value })
                                );
                                const filmsList = playersArray
                                    .map((player) => player.film)
                                    .filter(Boolean);
                                setFilms(filmsList);
                                console.log('Films for fusion:', filmsList);
                            }
                        })
                        .catch((error) => {
                            console.error('Error fetching players:', error);
                        });
                } else {
                    console.error('Room data not found');
                }
            })
            .catch((error) => {
                console.error('Error fetching room data:', error);
            });

        // Écoute de la disponibilité de l'image fusionnée
        const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
        const handleMergedImageValue = (snapshot) => {
            if (snapshot.exists()) {
                console.log('Le scénariste a généré l\'image fusionnée');
                // Navigation vers la phase de devinette
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
        console.log('Selected films for fusion:', updatedSelection);
    };

    const handleGenerateFusionImage = async () => {
        if (selectedFilms.length !== 2 || fusionPrompt.trim() === '') {
            alert('Please select two films and write a fusion prompt.');
            return;
        }

        setGeneratingImage(true);

        try {
            // Use the fusion prompt directly
            console.log('Generating fusion image with prompt:', fusionPrompt);

            // Call DALL·E API to generate the image
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
            console.log('Fusion image generated URL:', imageUrl);

            // Save the merged image and the films fused in Firebase
            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            await set(mergedImageRef, {
                imageUrl,
                prompt: fusionPrompt,
                films: selectedFilms,
                scenaristId: playerId, // Save scenaristId for later reference
            });

            setGeneratingImage(false);
            // The onValue listener will navigate to the next phase
        } catch (error) {
            console.error('Error generating fusion image:', error);
            setGeneratingImage(false);
        }
    };

    if (isScenarist) {
        return (
            <div>
                <h2>Phase 3: Fusion of Films</h2>
                <p>You are the scenarist! Select two films and write a fusion prompt.</p>
                <ul>
                    {films.map((film, index) => (
                        <li key={index}>
                            <input
                                type="checkbox"
                                value={film}
                                onChange={() => handleFilmSelection(film)}
                                disabled={
                                    selectedFilms.length >= 2 && !selectedFilms.includes(film)
                                }
                                checked={selectedFilms.includes(film)}
                            />
                            {film}
                        </li>
                    ))}
                </ul>
                {selectedFilms.length === 2 && (
                    <div>
                        <p>Write a detailed description of the fusion image (in English):</p>
                        <textarea
                            placeholder="Fusion prompt"
                            value={fusionPrompt}
                            onChange={(e) => setFusionPrompt(e.target.value)}
                        />
                        <button onClick={handleGenerateFusionImage} disabled={generatingImage}>
                            {generatingImage ? 'Generating Image...' : 'Generate Fusion Image'}
                        </button>
                    </div>
                )}
            </div>
        );
    } else {
        return (
            <div>
                <h2>Phase 3: Fusion of Films</h2>
                <p>Waiting for the scenarist to fuse two films...</p>
            </div>
        );
    }
}

export default GamePhase3;
