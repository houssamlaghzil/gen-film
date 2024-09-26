import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { database } from '../../firebaseConfig';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ref, set, update, get } from 'firebase/database';

console.log('GamePhase1.js chargé');

function GamePhase1() {
    const [films, setFilms] = useState([]);
    const [selectedFilm, setSelectedFilm] = useState('');
    const [description, setDescription] = useState('');
    const [graphicStyle, setGraphicStyle] = useState('');
    const [details, setDetails] = useState('');
    const [generatingImage, setGeneratingImage] = useState(false);
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const location = useLocation();
    const { playerId, pseudo } = location.state;

    useEffect(() => {
        console.log('useEffect - Loading films from a source API');
        console.log('roomCode:', roomCode);
        console.log('playerId:', playerId);
        console.log('pseudo:', pseudo);

        const MyJson = {
            "blockbusters": [
                "Avatar", "Avengers: Endgame", "Titanic", "Jurassic Park", "Le Roi Lion"
            ],
            "films_connus": [
                "The Grand Budapest Hotel", "Donnie Darko", "Whiplash", "Le Discours d'un Roi"
            ],
            "films_de_niche": [
                "The Lighthouse", "A Ghost Story", "Under the Skin"
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
                    { title: films_de_niche, popularity: 'Film de niche' }
                ];

                setFilms(filmsList);
                console.log('Films reçus:', filmsList);
            } catch (error) {
                console.error('Erreur lors de la récupération des films:', error);
            }
        };

        fetchFilms().then(() => console.log('Films récupérés'));
    }, []);

    const handleSubmit = async () => {
        console.log('handleSubmit - Film selected:', selectedFilm);
        console.log('Description:', description);
        console.log('GraphicStyle:', graphicStyle);
        console.log('Details:', details);

        if (!description || !graphicStyle || !details || !selectedFilm) {
            alert('Veuillez remplir tous les champs et sélectionner un film avant de générer l\'image.');
            return;
        }

        setGeneratingImage(true);

        try {
            console.log('Génération du prompt optimisé pour DALL·E 3');
            const gptResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: `Je veux une affiche de film qui montre : ${description}. Le style graphique utilisé doit être : ${graphicStyle}. Les détails les plus visibles seront : ${details}. Génère-moi un prompt en anglais optimisé pour DALL·E 3 qui respectera ces trois éléments. Le style de l'image doit être cohérent avec ce film : ${selectedFilm.title}.`,
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

            const generatedPrompt = gptResponse.data.choices[0].message.content;
            console.log('Prompt généré pour DALL·E 3:', generatedPrompt);

            const dalleResponse = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    prompt: generatedPrompt,
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
                prompt: generatedPrompt,
                imageUrl,
                pseudo,
            });

            const filmsRef = ref(database, `rooms/${roomCode}/films`);
            const filmsSnapshot = await get(filmsRef);
            const existingFilms = filmsSnapshot.exists() ? filmsSnapshot.val() : [];

            const updatedFilms = { ...existingFilms };
            updatedFilms[`film_${playerId}`] = selectedFilm.title;
            await update(filmsRef, updatedFilms);

            console.log('Film ajouté à la liste globale des films:', updatedFilms);

            // Marquer le joueur comme ayant terminé la phase 1
            await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
                hasFinishedPhase1: true,
                film: selectedFilm.title,
                filmPopularity: selectedFilm.popularity,
            });

            navigate(`/game/phase2/${roomCode}`, { state: { playerId, pseudo } });
        } catch (error) {
            console.error('Erreur lors de la génération de l\'image:', error);
        } finally {
            setGeneratingImage(false);
        }
    };

    return (
        <div>
            <h2>Phase 1 : Choisissez un film et rédigez les détails de l'affiche</h2>
            <p>Sélectionnez un film parmi la liste ci-dessous, puis décrivez l'affiche que vous souhaitez voir générée.</p>
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
                                    onChange={() => {
                                        setSelectedFilm(film);
                                        console.log('Selected film:', film);
                                    }}
                                />
                                {film.title} ({film.popularity})
                            </li>
                        ))}
                    </ul>

                    <h3>Décrire l'affiche :</h3>
                    <textarea
                        placeholder="Décrivez ce qu'on verra sur l'affiche"
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            console.log('Description updated:', e.target.value);
                        }}
                    />

                    <textarea
                        placeholder="Définissez le style graphique"
                        value={graphicStyle}
                        onChange={(e) => {
                            setGraphicStyle(e.target.value);
                            console.log('Graphic style updated:', e.target.value);
                        }}
                    />

                    <textarea
                        placeholder="Quels détails ressortiront le plus ?"
                        value={details}
                        onChange={(e) => {
                            setDetails(e.target.value);
                            console.log('Details updated:', e.target.value);
                        }}
                    />

                    <button onClick={handleSubmit} disabled={generatingImage}>
                        {generatingImage ? 'Génération en cours...' : 'Envoyer et générer l\'image'}
                    </button>
                </div>
            ) : (
                <p>Chargement des films...</p>
            )}
        </div>
    );
}

export default GamePhase1;
