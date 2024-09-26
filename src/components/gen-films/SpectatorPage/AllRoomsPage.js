// AllRoomsPage.js
import React, { useState, useEffect } from 'react';
import { database } from '../../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Link } from 'react-router-dom';

function AllRoomsPage() {
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        const roomsRef = ref(database, 'rooms/');
        onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setRooms(Object.keys(data));
            } else {
                setRooms([]);
            }
        });
    }, []);

    return (
        <div>
            <h2>Liste des rooms ouvertes</h2>
            {rooms.length > 0 ? (
                <ul>
                    {rooms.map((roomCode) => (
                        <li key={roomCode}>
                            <Link to={`/spectator/${roomCode}`}>Room: {roomCode}</Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Aucune room n'est actuellement ouverte.</p>
            )}
        </div>
    );
}

export default AllRoomsPage;
