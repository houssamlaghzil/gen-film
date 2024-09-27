// WizardDuel.js

import React, {useState, useEffect} from 'react';
import {auth, database} from '../../../firebaseConfig';
import {useParams} from 'react-router-dom';
import {setupFirebaseListeners, updatePlayerData} from './firebaseUtils';
import {evaluateSpell, arbitrateCombat} from './openaiUtils';
import {generateSpellSummary} from './helpers';
import {PHASES, PLAYER_STATUSES, MANA_REGEN} from './constants';
import SpellForm from './SpellForm';
import SpellSummary from './SpellSummary';
import CombatPhase from './CombatPhase';
import CombatResult from './CombatResult';
import OpponentStatus from './OpponentStatus';
import {onValue, ref} from "firebase/database";

console.log('WizardDuel component loaded');

function WizardDuel() {
    const {roomCode} = useParams();
    console.log('Room code:', roomCode);

    const [playerData, setPlayerData] = useState({
        health: 100,
        mana: 100,
        spell: {
            category: 'Attack',
            description: '',
            evaluation: null,
            summary: null,
        },
        status: PLAYER_STATUSES.WRITING,
    });

    const [opponentData, setOpponentData] = useState(null);
    const [phase, setPhase] = useState(PHASES.PREPARATION);
    const [playerId, setPlayerId] = useState(null);
    const [opponentId, setOpponentId] = useState(null);
    const [combatResult, setCombatResult] = useState(null);

    useEffect(() => {
        console.log('Setting up WizardDuel component');

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setPlayerId(user.uid);
                console.log('Player ID set:', user.uid);

                setupFirebaseListeners(
                    roomCode,
                    user.uid,
                    setPlayerData,
                    setOpponentData,
                    setOpponentId
                );
            } else {
                console.warn('User not authenticated');
            }
        });

        return () => {
            unsubscribe();
            console.log('Auth listener detached in WizardDuel');
        };
    }, [roomCode]);

    const handleSpellSubmit = async () => {
        console.log('Submitting spell:', playerData.spell);

        try {
            // Update player status to 'Reviewing' in database
            await updatePlayerData(roomCode, playerId, {status: PLAYER_STATUSES.REVIEWING});

            // Evaluate the spell via OpenAI
            const evaluation = await evaluateSpell({
                health: playerData.health,
                mana: playerData.mana,
                category: playerData.spell.category,
                description: playerData.spell.description,
            });

            console.log('Spell evaluation received:', evaluation);

            // Generate a summary of the spell
            const summary = generateSpellSummary(evaluation);

            const updatedPlayerData = {
                ...playerData,
                spell: {
                    ...playerData.spell,
                    evaluation: evaluation,
                    summary: summary,
                },
                status: PLAYER_STATUSES.REVIEWING,
            };

            setPlayerData(updatedPlayerData);

            // Save updated data to Firebase
            await updatePlayerData(roomCode, playerId, updatedPlayerData);
            console.log('Player data saved to Firebase');

            setPhase(PHASES.REVIEW);
        } catch (error) {
            console.error('Error submitting spell:', error);
            alert('Error submitting spell. Please try again.');
        }
    };

    const handleReadyToAttack = async () => {
        console.log('Player is ready to attack');

        // Update player status to 'Ready'
        await updatePlayerData(roomCode, playerId, {status: PLAYER_STATUSES.READY});

        setPlayerData((prevData) => ({
            ...prevData,
            status: PLAYER_STATUSES.READY,
        }));
    };

    useEffect(() => {
        // Check if both players are ready to attack
        if (
            phase === PHASES.REVIEW &&
            opponentData &&
            opponentData.status === PLAYER_STATUSES.READY &&
            playerData.status === PLAYER_STATUSES.READY
        ) {
            setPhase(PHASES.COMBAT);
        }
    }, [phase, opponentData, playerData.status]);

    const handleCombat = async () => {
        console.log('Starting combat phase');

        if (!opponentData) {
            console.warn('Opponent data not available yet');
            alert('Waiting for opponent data. Please try again in a moment.');
            return;
        }

        const combatData = {
            playerSpell: playerData.spell.evaluation,
            opponentSpell: opponentData.spell.evaluation,
            terrainEffects: [], // Add terrain effects if any
            summons: [], // Add active summons if any
        };

        try {
            // Arbitrate the combat via OpenAI
            const result = await arbitrateCombat(combatData);
            console.log('Combat result received:', result);

            // Update health and mana based on combat result
            const updatedPlayerData = {
                ...playerData,
                health: playerData.health - (result.damageToPlayer || 0),
                mana: playerData.mana - (result.manaCostToPlayer || 0),
                status: PLAYER_STATUSES.REVIEWING, // Reset status for next phase
            };

            setPlayerData(updatedPlayerData);

            // Save updated data to Firebase
            await updatePlayerData(roomCode, playerId, updatedPlayerData);
            console.log('Player data updated after combat');

            setCombatResult(result); // Store combat result and explanation
            setPhase(PHASES.RESULT);
        } catch (error) {
            console.error('Error during combat:', error);
            alert('Error during combat. Please try again.');
        }
    };

    const handleNextRound = async () => {
        console.log('Player is ready for next round');

        // Update player status to 'NextRound'
        await updatePlayerData(roomCode, playerId, {status: PLAYER_STATUSES.NEXT_ROUND});

        setPlayerData((prevData) => ({
            ...prevData,
            status: PLAYER_STATUSES.NEXT_ROUND,
        }));
    };

    useEffect(() => {
        // Check if both players are ready for next round
        if (
            phase === PHASES.RESULT &&
            opponentData &&
            opponentData.status === PLAYER_STATUSES.NEXT_ROUND &&
            playerData.status === PLAYER_STATUSES.NEXT_ROUND
        ) {
            // Proceed to next round
            const newMana = playerData.mana + MANA_REGEN;
            const updatedPlayerData = {
                ...playerData,
                mana: newMana,
                spell: {
                    category: 'Attack',
                    description: '',
                    evaluation: null,
                    summary: null,
                },
                status: PLAYER_STATUSES.WRITING,
            };

            setPlayerData(updatedPlayerData);

            // Update player data in Firebase
            updatePlayerData(roomCode, playerId, updatedPlayerData).then(r => console.log('Player data updated for next round'));

            setPhase(PHASES.PREPARATION);
        }
    }, [phase, opponentData, playerData.status, playerData.mana, playerId, roomCode, playerData]);

    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    // Inside useEffect or setupFirebaseListeners
    onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log('Player data updated:', data);

            setPlayerData((prevData) => ({
                ...prevData,
                ...data,
                spell: {
                    category: data.spell?.category || prevData.spell.category || 'Attack',
                    description: data.spell?.description || prevData.spell.description || '',
                    evaluation: data.spell?.evaluation ?? prevData.spell.evaluation ?? null,
                    summary: data.spell?.summary ?? prevData.spell.summary ?? null,
                },
            }));
        }
    });
    return (
        <div>
            <h1>Wizard Duel Game</h1>
            <p>Room Code: {roomCode}</p>
            <p>Phase: {phase}</p>
            <p>Health: {playerData.health}</p>
            <p>Mana: {playerData.mana}</p>
            <OpponentStatus opponentData={opponentData}/>

            {phase === PHASES.PREPARATION && (
                <SpellForm playerData={playerData} setPlayerData={setPlayerData} handleSpellSubmit={handleSpellSubmit}/>
            )}

            {phase === PHASES.REVIEW && (
                <SpellSummary
                    summary={playerData.spell.summary}
                    handleReadyToAttack={handleReadyToAttack}
                    opponentData={opponentData}
                />
            )}

            {phase === PHASES.COMBAT && (
                <CombatPhase handleCombat={handleCombat}/>
            )}

            {phase === PHASES.RESULT && (
                <CombatResult
                    combatResult={combatResult}
                    handleNextRound={handleNextRound}
                    opponentData={opponentData}
                />
            )}

            {opponentId ? (
                <p>Opponent found: {opponentId}</p>
            ) : (
                <p>Waiting for opponent...</p>
            )}
        </div>
    );
}

export default WizardDuel;
