// CombatResult.js

import React from 'react';
import OpponentStatus from './OpponentStatus';

console.log('CombatResult component loaded');

const CombatResult = ({ combatResult, handleNextRound, opponentData }) => {
    console.log('Rendering CombatResult with combatResult:', combatResult);

    return (
        <div>
            <h2>Combat Result</h2>
            <p>{combatResult ? combatResult.combatNarration : 'Waiting for result...'}</p>
            <button onClick={handleNextRound}>Start Next Round</button>
            <OpponentStatus opponentData={opponentData} />
        </div>
    );
};

export default CombatResult;
