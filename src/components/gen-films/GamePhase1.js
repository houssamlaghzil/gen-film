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
        //re cupere ce json et mes le dans une variable "src/list de films/listfilms.json"
        const MyJson =
            {
                "blockbusters": [
                    "Avatar",
                    "Avengers: Endgame",
                    "Titanic",
                    "Jurassic Park",
                    "The Lion King",
                    "Star Wars: The Force Awakens",
                    "Furious 7",
                    "The Dark Knight",
                    "Harry Potter and the Sorcerer's Stone",
                    "Frozen",
                    "Black Panther",
                    "The Avengers",
                    "Spider-Man: No Way Home",
                    "Inception",
                    "The Lord of the Rings: The Return of the King",
                    "Pirates of the Caribbean: Dead Man's Chest",
                    "The Matrix",
                    "Finding Nemo",
                    "Toy Story 3",
                    "Transformers: Dark of the Moon",
                    "The Hunger Games",
                    "The Twilight Saga: Breaking Dawn Part 2",
                    "Jumanji: Welcome to the Jungle",
                    "Iron Man 3",
                    "Shrek 2",
                    "Batman v Superman: Dawn of Justice",
                    "Captain America: Civil War",
                    "Aquaman",
                    "Zootopia",
                    "Beauty and the Beast (2017)"
                ],
                "known_films": [
                    "The Grand Budapest Hotel",
                    "Donnie Darko",
                    "Whiplash",
                    "The King's Speech",
                    "A Beautiful Mind",
                    "Moonlight",
                    "Her",
                    "Birdman",
                    "Little Miss Sunshine",
                    "The Social Network",
                    "The Imitation Game",
                    "Prisoners",
                    "The Revenant",
                    "Gone Girl",
                    "Slumdog Millionaire",
                    "Django Unchained",
                    "Mad Max: Fury Road",
                    "La La Land",
                    "12 Years a Slave",
                    "The Theory of Everything",
                    "Ex Machina",
                    "Drive",
                    "The Big Short",
                    "Room",
                    "No Country for Old Men",
                    "The Shape of Water",
                    "The Hurt Locker",
                    "The Fighter",
                    "Memento",
                    "Spotlight"
                ],
                "niche_films": [
                    "The Lighthouse",
                    "A Ghost Story",
                    "Under the Skin",
                    "The Florida Project",
                    "Enemy",
                    "The Witch",
                    "Enter the Void",
                    "Only Lovers Left Alive",
                    "Annihilation",
                    "Swiss Army Man",
                    "Blue Ruin",
                    "Tangerine",
                    "It Comes at Night",
                    "The Turin Horse",
                    "The Endless",
                    "Upstream Color",
                    "American Honey",
                    "Raw",
                    "Climax",
                    "Mandy",
                    "Under the Silver Lake",
                    "First Reformed",
                    "Colossal",
                    "The Art of Self-Defense",
                    "Uncut Gems",
                    "The Wind",
                    "Nightcrawler",
                    "The Lobster",
                    "A Girl Walks Home Alone at Night",
                    "Beyond the Black Rainbow"
                ]
            }


        // Fonction pour récupérer les films depuis l'API OpenAI
        const fetchFilms = async () => {
            try {
                //choisi un film aleatoirement dans le json 1 par categorie
                const blockbusters = MyJson.blockbusters[Math.floor(Math.random() * MyJson.blockbusters.length)];
                const known_films = MyJson.known_films[Math.floor(Math.random() * MyJson.known_films.length)];
                const niche_films = MyJson.niche_films[Math.floor(Math.random() * MyJson.niche_films.length)];


                console.log('Récupération des films depuis l\'API GPT-3.5');
/*                const jsonString = JSON.stringify(MyJson);
                let response;
                response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'user',
                                content: `Donne-moi une liste de 3 films de popularités différentes  piocher aleatoirements
                                (Blockbusters, assez connus, niche). Pour chaque film, donne le titre et son niveau de popularité au format :
                                 "Titre du film" - popularité.
                                 Inspire-toi de ce JSON : ${jsonString}`

                            },
                        ],
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                        },
                    }
                );*/

                /*const filmsList = response.data.choices[0].message.content
                    .split('\n')
                    .filter((line) => line)
                    .map((line) => line.replace(/^\d+\.\s*!/, ''))
                    .map((line) => {
                        const [title, popularity] = line.split(' - ');
                        return {title: title.replace(/"/g, '').trim(), popularity: popularity.trim()};
                    });*/
                const filmsList = [
                    {title: blockbusters, popularity: 'Blockbusters'},
                    {title: known_films, popularity: 'Assez connus'},
                    {title: niche_films, popularity: 'Niche'},
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
