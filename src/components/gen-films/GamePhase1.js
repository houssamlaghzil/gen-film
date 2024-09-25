// GamePhase1.js
import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {database} from '../../firebaseConfig';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import {ref, set, update} from 'firebase/database';

console.log('GamePhase1.js chargé');

function GamePhase1() {
    const [films, setFilms] = useState([]);
    const [selectedFilm, setSelectedFilm] = useState('');
    const [prompt, setPrompt] = useState('');
    const navigate = useNavigate();
    const {roomCode} = useParams();
    const location = useLocation();
    const {playerId, pseudo} = location.state;

    useEffect(() => {
        console.log('Chargement des films depuis l\'API GPT-3.5');
        // Fonction pour récupérer les films depuis l'API OpenAI
        const fetchFilms = async () => {
            try {
                const response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'user',
                                content:
                                    'Donne-moi une liste de 3 films de popularités différentes (connu, moins connu, niche). Pour chaque film, donne le titre et son niveau de popularité au format : "Titre du film" - popularité. Et uniquement ça rien d autre.',
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

                const filmsList = response.data.choices[0].message.content
                    .split('\n')
                    .filter((line) => line)
                    .map((line) => line.replace(/^\d+\.\s*/, ''))
                    .map((line) => {
                        const [title, popularity] = line.split(' - ');
                        return {title: title.replace(/"/g, '').trim(), popularity: popularity.trim()};
                    });

                setFilms(filmsList);
                console.log('Films reçus:', filmsList);
            } catch (error) {
                console.error('Erreur lors de la récupération des films:', error);
            }
        };


        fetchFilms().then(r => console.log('Films récupérés'));
    }, []);

    const handleSubmit = async () => {
        console.log('Envoi du prompt pour le film:', selectedFilm);

        try {
            // Appeler l'API GPT-3.5 pour améliorer le prompt
            const adjustedPromptResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: `Améliore ce prompt en optimisent les détails sur l'arrière-plan et le style graphique, en ajoutant des detail qui colle avec le prompte d'origine, pour obtenir un prompte qui tire le meilleur de dall-e 3 (assure toi que ce prompte soit accepter par dall-e modifi les aspect qui pourais bloquer pour que sa passe): ${prompt}`,
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

            const adjustedPrompt =
                adjustedPromptResponse.data.choices[0].message.content;
            console.log('Prompt ajusté pour DALL·E:', adjustedPrompt);

            // Appeler l'API DALL·E pour générer l'image avec le prompt amélioré
            const dalleResponse = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    prompt: adjustedPrompt,
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
            console.log('Image générée URL:', imageUrl);

            // Enregistrer le prompt et l'image dans Firebase
            await set(ref(database, `rooms/${roomCode}/prompts/${playerId}`), {
                film: selectedFilm.title,
                filmPopularity: selectedFilm.popularity,
                prompt, // On enregistre le prompt original
                imageUrl,
                pseudo,
            });

            // Mettre à jour l'état du joueur et ajouter le film sélectionné
            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                hasFinished: true,
                film: selectedFilm.title,
                filmPopularity: selectedFilm.popularity,
            });

            navigate(`/game/phase2/${roomCode}`, {state: {playerId, pseudo}});
        } catch (error) {
            console.error('Erreur lors du traitement du prompt:', error);
        }
    };


    return (
        <div>
            <h2>Phase 1 : Choisissez un film et rédigez un prompt</h2>
            <p>
                Sélectionnez un film parmi la liste ci-dessous et rédigez un prompt
                décrivant une scène ou un élément du film. Votre prompt sera amélioré
                pour générer une image attrayante.
            </p>
            {films.length > 0 ? (
                <div>
                    <h3>Films proposés :</h3>
                    <ul>
                        {films.map((film, index) => (
                            <li key={index}>
                                <input
                                    type="radio"
                                    name="film"
                                    value={index}
                                    onChange={() => setSelectedFilm(film)}
                                />
                                {film.title} ({film.popularity})
                            </li>
                        ))}

                    </ul>
                    <textarea
                        placeholder="Rédigez votre prompt ici"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button onClick={handleSubmit} disabled={!selectedFilm || !prompt}>
                        Envoyer
                    </button>
                </div>
            ) : (
                <p>Chargement des films...</p>
            )}
        </div>
    );
}

export default GamePhase1;
