import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, get, onValue, off, set, update } from 'firebase/database';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

console.log('FusionGuessing.js chargé');

function FusionGuessing() {
    const [imageUrl, setImageUrl] = useState('');
    const [films, setFilms] = useState([]);
    const [guesses, setGuesses] = useState({ guess1: '', guess2: '' });
    const [waiting, setWaiting] = useState(false);
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;
    const [scenarist, setScenarist] = useState('');
    const [players, setPlayers] = useState([]);
    const [correctFilms, setCorrectFilms] = useState([]); // Ajout pour stocker les films fusionnés

    useEffect(() => {
        console.log('Chargement de l\'image fusionnée et des films');

        const fetchScenaristAndPlayers = async () => {
            const roomRef = ref(database, `rooms/${roomCode}`);
            const roomSnapshot = await get(roomRef);
            const roomData = roomSnapshot.val();
            if (roomData) {
                setScenarist(roomData.scenaristPseudo);
                setPlayers(roomData.players || []);
                setCorrectFilms(roomData.mergedImage.films || []); // Récupérer les films fusionnés
                console.log('Films fusionnés:', roomData.mergedImage.films);
            }
        };

        fetchScenaristAndPlayers();

        const fetchFusionData = async () => {
            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            const mergedImageSnapshot = await get(mergedImageRef);
            const mergedImageData = mergedImageSnapshot.val();

            if (mergedImageData) {
                setImageUrl(mergedImageData.imageUrl);
                console.log('Image fusionnée chargée:', mergedImageData.imageUrl);

                const filmsRef = ref(database, `rooms/${roomCode}/films`);
                const filmsSnapshot = await get(filmsRef);
                const filmsData = filmsSnapshot.val();

                const filmsArray = Object.values(filmsData);
                setFilms(filmsArray);
                console.log('Films chargés:', filmsArray);
            }
        };

        fetchFusionData();

        return () => {
            off(ref(database, `rooms/${roomCode}/mergedImage`));
            off(ref(database, `rooms/${roomCode}/films`));
        };
    }, [roomCode]);

    const handleSubmitGuesses = async () => {
        if (!guesses.guess1 || !guesses.guess2) {
            alert('Veuillez sélectionner vos devinettes pour les deux films.');
            return;
        }

        // Calcul des scores en fonction des devinettes
        let score = 0;
        if (guesses.guess1 === correctFilms[0] || guesses.guess1 === correctFilms[1]) {
            score += 1;
        }
        if (guesses.guess2 === correctFilms[0] || guesses.guess2 === correctFilms[1]) {
            score += 1;
        }

        try {
            // Soumission des devinettes et mise à jour des scores
            const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
            await update(playerRef, {
                guesses: {
                    guess1: guesses.guess1,
                    guess2: guesses.guess2,
                },
                scorePhase2: score, // Enregistrement du score pour cette phase
                totalScore: (await get(playerRef)).val().totalScore + score, // Mise à jour du score total
                hasFinished: true,
            });

            console.log('Soumission des devinettes et mise à jour des scores:', guesses);
            setWaiting(true);
        } catch (error) {
            console.error('Erreur lors de la soumission des devinettes:', error);
        }
    };

    useEffect(() => {
        // Vérifier si tous les joueurs (sauf le scénariste) ont terminé
        const guessesRef = ref(database, `rooms/${roomCode}/guesses`);
        onValue(guessesRef, (snapshot) => {
            const guessesData = snapshot.val();
            const totalPlayers = Object.keys(players).length - 1; // Ne compte pas le scénariste
            const totalGuesses = guessesData ? Object.keys(guessesData).length : 0;

            if (totalGuesses >= totalPlayers) {
                console.log('Tous les joueurs ont terminé');
                navigate(`/scoreboard/${roomCode}`, { state: { playerId, pseudo } });
            }
        });

        return () => {
            off(guessesRef);
        };
    }, [players, roomCode, navigate, playerId, pseudo]);

    if (pseudo === scenarist) {
        return (
            <div>
                <h2>Phase de devinette des films fusionnés</h2>
                {imageUrl && <img src={imageUrl} alt="Fusion Image" />}
                <p>Vous êtes le scénariste, vous ne pouvez pas deviner.</p>
            </div>
        );
    }

    if (waiting) {
        return (
            <div>
                <h2>Phase de devinette des films fusionnés</h2>
                {imageUrl && <img src={imageUrl} alt="Fusion Image" />}
                <p>En attente des autres joueurs.</p>
            </div>
        );
    }

    return (
        <div>
            <h2>Phase de devinette des films fusionnés</h2>
            {imageUrl && <img src={imageUrl} alt="Fusion Image" />}
            <p>Essayez de deviner quels films ont été fusionnés !</p>
            <ul>
                <li>
                    <label>Devine 1</label>
                    <select
                        value={guesses.guess1}
                        onChange={(e) => setGuesses({ ...guesses, guess1: e.target.value })}
                    >
                        <option value="">Sélectionnez un film</option>
                        {films.map((film, index) => (
                            <option key={index} value={film}>{film}</option>
                        ))}
                    </select>
                </li>
                <li>
                    <label>Devine 2</label>
                    <select
                        value={guesses.guess2}
                        onChange={(e) => setGuesses({ ...guesses, guess2: e.target.value })}
                    >
                        <option value="">Sélectionnez un film</option>
                        {films.map((film, index) => (
                            <option key={index} value={film}>{film}</option>
                        ))}
                    </select>
                </li>
            </ul>
            <button onClick={handleSubmitGuesses}>Soumettre vos devinettes</button>
        </div>
    );
}

export default FusionGuessing;
