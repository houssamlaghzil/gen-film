import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, get, update, onValue, off } from 'firebase/database';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

console.log('GamePhase3.js chargé');

function GamePhase3() {
    const [isScenarist, setIsScenarist] = useState(false);
    const [films, setFilms] = useState([]);
    const [selectedFilms, setSelectedFilms] = useState([]);
    const [fusionPrompt, setFusionPrompt] = useState('');
    const [generatingImage, setGeneratingImage] = useState(false);
    const [scenarist, setScenarist] = useState(null);
    const [imageReady, setImageReady] = useState(false); // New state to track if the image is ready
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    useEffect(() => {
        console.log('Vérification du scénariste et chargement des films sélectionnés');

        const designateScenarist = async () => {
            const playersRef = ref(database, `rooms/${roomCode}/players`);
            const playersSnapshot = await get(playersRef);
            const playersData = playersSnapshot.val();

            if (playersData) {
                const sortedPlayers = Object.values(playersData).sort((a, b) => b.totalScore - a.totalScore);
                const highestScore = sortedPlayers[0].totalScore;

                const topScorers = sortedPlayers.filter(player => player.totalScore === highestScore);
                const chosenScenarist = topScorers[Math.floor(Math.random() * topScorers.length)];

                console.log(`Scénariste désigné: ${chosenScenarist.pseudo}`);

                await update(ref(database, `rooms/${roomCode}`), {
                    scenaristPseudo: chosenScenarist.pseudo
                });

                setScenarist(chosenScenarist.pseudo);

                if (chosenScenarist.pseudo === pseudo) {
                    setIsScenarist(true);
                }
            }
        };

        // Charger la liste globale des films sélectionnés par les joueurs
        const fetchFilms = async () => {
            const filmsRef = ref(database, `rooms/${roomCode}/films`);
            const filmsSnapshot = await get(filmsRef);
            const filmsData = filmsSnapshot.val();

            if (filmsData) {
                const filmsArray = Object.values(filmsData);
                setFilms(filmsArray);
                console.log('Films récupérés pour la fusion:', filmsArray);
            }
        };

        const roomRef = ref(database, `rooms/${roomCode}`);
        onValue(roomRef, (snapshot) => {
            const roomData = snapshot.val();
            if (roomData && roomData.scenaristPseudo) {
                setScenarist(roomData.scenaristPseudo);
                if (roomData.scenaristPseudo === pseudo) {
                    setIsScenarist(true);
                }
            } else {
                designateScenarist();
            }

            // Check if the merged image is ready and redirect the players
            if (roomData && roomData.mergedImage && roomData.mergedImage.imageUrl) {
                setImageReady(true);
                console.log('Image fusionnée prête, redirection des joueurs.');
                navigate(`/fusion-guessing/${roomCode}`, { state: { playerId, pseudo } });
            }
        });

        fetchFilms();

        return () => {
            off(roomRef);
        };
    }, [roomCode, pseudo, navigate]);

    const handleFilmSelection = (film) => {
        let updatedSelection = [...selectedFilms];
        if (updatedSelection.includes(film)) {
            updatedSelection = updatedSelection.filter((f) => f !== film);
        } else if (updatedSelection.length < 2) {
            updatedSelection.push(film);
        }
        setSelectedFilms(updatedSelection);
        console.log('Films sélectionnés:', updatedSelection);
    };

    const handleGenerateFusionImage = async () => {
        if (selectedFilms.length !== 2 || fusionPrompt.trim() === '') {
            alert('Veuillez sélectionner deux films et rédiger un prompt de fusion.');
            return;
        }

        setGeneratingImage(true);
        console.log('Génération de l\'image de fusion pour les films:', selectedFilms);

        try {
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
            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            await update(mergedImageRef, {
                imageUrl,
                prompt: fusionPrompt,
                films: selectedFilms,
                scenaristPseudo: scenarist,
            });

            console.log('Image fusionnée générée et enregistrée:', imageUrl);

            // Rediriger les joueurs vers la Phase de devinette
            setImageReady(true);
            navigate(`/fusion-guessing/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Erreur lors de la génération de l\'image fusionnée:', error);
            setGeneratingImage(false);
        }
    };

    if (scenarist && !isScenarist && !imageReady) {
        return (
            <div>
                <h2>Phase 3 : Fusion des films</h2>
                <p>En attente que {scenarist} fusionne deux films...</p>
            </div>
        );
    }

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
                <p>En attente que le scénariste soit désigné...</p>
            </div>
        );
    }
}

export default GamePhase3;
