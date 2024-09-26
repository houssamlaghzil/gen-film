import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, get, onValue, off, update } from 'firebase/database';
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
    const [correctFilms, setCorrectFilms] = useState([]);

    useEffect(() => {
        console.log('useEffect - Chargement de l\'image fusionnée et des films');
        console.log('roomCode:', roomCode);

        const fetchScenaristAndPlayers = async () => {
            console.log('Fetching scenarist and players');
            const roomRef = ref(database, `rooms/${roomCode}`);
            const roomSnapshot = await get(roomRef);
            const roomData = roomSnapshot.val();
            if (roomData) {
                setScenarist(roomData.scenaristPseudo);
                console.log('scenaristPseudo:', roomData.scenaristPseudo);
                setPlayers(roomData.players || []);
                console.log('Players:', roomData.players || []);
                setCorrectFilms(roomData.mergedImage.films || []);
                console.log('Films fusionnés:', roomData.mergedImage.films || []);
            }
        };

        fetchScenaristAndPlayers();

        const fetchFusionData = async () => {
            console.log('Fetching fusion data');
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
            console.log('Cleaning up listeners');
            off(ref(database, `rooms/${roomCode}/mergedImage`));
            off(ref(database, `rooms/${roomCode}/films`));
        };
    }, [roomCode]);

    const handleSubmitGuesses = async () => {
        console.log('handleSubmitGuesses - guesses:', guesses);

        if (!guesses.guess1 || !guesses.guess2) {
            alert('Veuillez sélectionner vos devinettes pour les deux films.');
            return;
        }

        let score = 0;
        if (guesses.guess1 === correctFilms[0] || guesses.guess1 === correctFilms[1]) {
            score += 1;
        }
        if (guesses.guess2 === correctFilms[0] || guesses.guess2 === correctFilms[1]) {
            score += 1;
        }
        console.log('Calculated score:', score);

        try {
            console.log('Updating player scores and guesses in the database');
            const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
            await update(playerRef, {
                guesses: {
                    guess1: guesses.guess1,
                    guess2: guesses.guess2,
                },
                scorePhase2: score, // Enregistrement du score pour cette phase
                totalScore: (await get(playerRef)).val().totalScore + score, // Mise à jour du score total
                hasFinishedFusionGuessing: true, // Indiquer que ce joueur a terminé la phase de devinette
            });

            console.log('Guesses and scores successfully submitted:', guesses);
            setWaiting(true);
        } catch (error) {
            console.error('Error submitting guesses:', error);
        }
    };

    useEffect(() => {
        console.log('useEffect - Checking if all players finished guessing');
        const guessesRef = ref(database, `rooms/${roomCode}/players`);
        onValue(guessesRef, (snapshot) => {
            const playersData = snapshot.val();
            const totalPlayers = Object.keys(playersData).length - 1; // Ne compte pas le scénariste
            const totalGuesses = Object.values(playersData).filter(player => player.hasFinishedFusionGuessing).length;

            if (totalGuesses >= totalPlayers) {
                console.log('All players have finished guessing');
                navigate(`/scoreboard/${roomCode}`, { state: { playerId, pseudo } });
            }
        });

        return () => {
            console.log('Cleaning up guessesRef listener');
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
                        onChange={(e) => {
                            setGuesses({ ...guesses, guess1: e.target.value });
                            console.log('guesses.guess1 updated:', e.target.value);
                        }}
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
                        onChange={(e) => {
                            setGuesses({ ...guesses, guess2: e.target.value });
                            console.log('guesses.guess2 updated:', e.target.value);
                        }}
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
