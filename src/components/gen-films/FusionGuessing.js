import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, get, onValue, off, set } from 'firebase/database';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

console.log('FusionGuessing.js chargé');

function FusionGuessing() {
    const [imageUrl, setImageUrl] = useState('');
    const [films, setFilms] = useState([]);
    const [guesses, setGuesses] = useState({ guess1: '', guess2: '' });
    const [waiting, setWaiting] = useState(false); // Changed to false to avoid waiting initially
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;
    const [scenarist, setScenarist] = useState('');

    useEffect(() => {
        console.log('Chargement de l\'image fusionnée et des films');

        // Fetch the scenarist's pseudo to exclude them from guessing
        const fetchScenarist = async () => {
            const roomRef = ref(database, `rooms/${roomCode}`);
            const roomSnapshot = await get(roomRef);
            const roomData = roomSnapshot.val();
            if (roomData && roomData.scenaristPseudo) {
                setScenarist(roomData.scenaristPseudo);
                console.log('Scénariste trouvé:', roomData.scenaristPseudo);
            }
        };

        fetchScenarist();

        const fetchFusionData = async () => {
            const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
            const mergedImageSnapshot = await get(mergedImageRef);
            const mergedImageData = mergedImageSnapshot.val();

            if (mergedImageData) {
                setImageUrl(mergedImageData.imageUrl);
                console.log('Image fusionnée chargée:', mergedImageData.imageUrl);

                // Récupération des films fusionnés
                const filmsRef = ref(database, `rooms/${roomCode}/films`);
                const filmsSnapshot = await get(filmsRef);
                const filmsData = filmsSnapshot.val();

                // Transformer l'objet de films en tableau avant d'utiliser .map()
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
            alert('Veuillez entrer vos devinettes pour les deux films.');
            return;
        }

        // Soumission des devinettes
        try {
            const guessRef = ref(database, `rooms/${roomCode}/guesses/${playerId}`);
            await set(guessRef, {
                guess1: guesses.guess1,
                guess2: guesses.guess2,
            });
            console.log('Soumission des devinettes pour la Phase 2:', guesses);
            setWaiting(true); // En attente des autres joueurs
        } catch (error) {
            console.error('Erreur lors de la soumission des devinettes:', error);
        }
    };

    // Exclude scenarist from guessing
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
                {films.map((film, index) => (
                    <li key={index}>
                        <input
                            type="text"
                            placeholder={`Devine ${index + 1}`}
                            value={guesses[`guess${index + 1}`]}
                            onChange={(e) => setGuesses({ ...guesses, [`guess${index + 1}`]: e.target.value })}
                        />
                    </li>
                ))}
            </ul>
            <button onClick={handleSubmitGuesses}>Soumettre vos devinettes</button>
        </div>
    );
}

export default FusionGuessing;
