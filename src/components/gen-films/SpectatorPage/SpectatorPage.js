// SpectatorPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { database } from '../../../firebaseConfig';
import { ref, onValue, get, off } from 'firebase/database';
import { QRCodeSVG } from 'qrcode.react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

function SpectatorPage() {
    const { roomCode } = useParams();
    const [gamePhase, setGamePhase] = useState(null);
    const [players, setPlayers] = useState([]);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [images, setImages] = useState([]);
    const [phaseInfo, setPhaseInfo] = useState('');

    useEffect(() => {
        if (roomCode) {
            setQrCodeUrl(`${window.location.origin}/join-room/${roomCode}`);

            const roomRef = ref(database, `rooms/${roomCode}`);

            // Écouter les données de la room et les joueurs connectés
            const handleRoomData = (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const currentPhase = data.phase || 0;
                    setGamePhase(currentPhase);

                    // Afficher les informations sur la phase en cours
                    switch (currentPhase) {
                        case 1:
                            setPhaseInfo('Phase 1 : Choisissez un film et rédigez un prompt.');
                            break;
                        case 2:
                            setPhaseInfo('Phase 2 : Devinez les films.');
                            break;
                        case 3:
                            setPhaseInfo('Phase 3 : Fusionnez deux films.');
                            break;
                        case 4:
                            setPhaseInfo('Fin du jeu : Affichage des scores et des images générées.');
                            fetchGeneratedImages();
                            break;
                        default:
                            setPhaseInfo('La partie n\'a pas encore commencé.');
                    }
                }
            };

            onValue(roomRef, handleRoomData);

            const playersRef = ref(database, `rooms/${roomCode}/players`);
            onValue(playersRef, (snapshot) => {
                const playersData = snapshot.val();
                if (playersData) {
                    setPlayers(Object.values(playersData));
                }
            });

            return () => {
                off(roomRef, 'value', handleRoomData);
                off(playersRef, 'value');
            };
        }
    }, [roomCode]);

    const fetchGeneratedImages = async () => {
        const mergedImageRef = ref(database, `rooms/${roomCode}/mergedImage`);
        const mergedImageSnapshot = await get(mergedImageRef);
        const mergedImageData = mergedImageSnapshot.val();

        if (mergedImageData && mergedImageData.imageUrl) {
            setImages([mergedImageData.imageUrl]);
        }

        const promptsRef = ref(database, `rooms/${roomCode}/prompts`);
        const promptsSnapshot = await get(promptsRef);
        const promptsData = promptsSnapshot.val();
        if (promptsData) {
            const imagesList = Object.values(promptsData).map((prompt) => prompt.imageUrl);
            setImages((prevImages) => [...prevImages, ...imagesList]);
        }
    };

    return (
        <div>
            <h2>Spectateur de la Room: {roomCode}</h2>
            <h3>Code QR pour rejoindre la room :</h3>
            {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} />}

            <h3>Joueurs connectés :</h3>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>{player.pseudo}</li>
                ))}
            </ul>

            <h3>{phaseInfo}</h3>
            {gamePhase === 4 && images.length > 0 && (
                <div>
                    <h3>Images Générées :</h3>
                    <Carousel showThumbs={false} infiniteLoop autoPlay>
                        {images.map((imageUrl, index) => (
                            <div key={index}>
                                <img src={imageUrl} alt={`Image ${index + 1}`} />
                            </div>
                        ))}
                    </Carousel>
                </div>
            )}
        </div>
    );
}

export default SpectatorPage;
