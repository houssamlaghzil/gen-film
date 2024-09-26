// GamePhase1.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { database } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ref, set, update } from 'firebase/database';

console.log('GamePhase1.js chargé');

function GamePhase1() {
    const [films, setFilms] = useState([]);
    const [selectedFilm, setSelectedFilm] = useState('');
    const [prompt, setPrompt] = useState('');
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    useEffect(() => {
        console.log('Chargement des films depuis l\'API GPT-3.5');

        const MyJson = {
            "blockbusters": [
                "Avatar", "Avengers: Endgame", "Titanic", "Jurassic Park", "Le Roi Lion",
                "Star Wars: Le Réveil de la Force", "Furious 7", "The Dark Knight",
                "Harry Potter à l'école des sorciers", "La Reine des neiges"
            ],
            "films_connus": [
                "The Grand Budapest Hotel", "Donnie Darko", "Whiplash", "Le Discours d'un Roi",
                "Une merveilleuse histoire du temps", "Moonlight", "Her", "Birdman",
                "Little Miss Sunshine", "The Social Network"
            ],
            "films_de_niche": [
                "The Lighthouse", "A Ghost Story", "Under the Skin", "The Florida Project",
                "Enemy", "The Witch", "Enter the Void", "Only Lovers Left Alive",
                "Annihilation", "Swiss Army Man"
            ]
        };

        const fetchFilms = async () => {
            try {
                const blockbusters = MyJson.blockbusters[Math.floor(Math.random() * MyJson.blockbusters.length)];
                const films_connus = MyJson.films_connus[Math.floor(Math.random() * MyJson.films_connus.length)];
                const films_de_niche = MyJson.films_de_niche[Math.floor(Math.random() * MyJson.films_de_niche.length)];

                const filmsList = [
                    { title: blockbusters, popularity: 'Blockbuster' },
                    { title: films_connus, popularity: 'Film connu' },
                    { title: films_de_niche, popularity: 'Film de niche' },
                ];

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
            const adjustedPromptResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: `Améliore ce prompt pour qu'il soit accepté par DALL-E 3 : ${prompt}`,
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

            const adjustedPrompt = adjustedPromptResponse.data.choices[0].message.content;
            console.log('Prompt ajusté pour DALL·E:', adjustedPrompt);

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

            await set(ref(database, `rooms/${roomCode}/prompts/${playerId}`), {
                film: selectedFilm.title,
                filmPopularity: selectedFilm.popularity,
                prompt,
                imageUrl,
                pseudo,
            });

            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                hasFinished: true,
                film: selectedFilm.title,
                filmPopularity: selectedFilm.popularity,
            });

            navigate(`/game/phase2/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Erreur lors du traitement du prompt:', error);
        }
    };

    return (
        <div>
            <h2>Phase 1 : Choisissez un film et rédigez un prompt</h2>
            <p>
                Sélectionnez un film parmi la liste ci-dessous et rédigez un prompt décrivant une scène ou un élément du film.
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
