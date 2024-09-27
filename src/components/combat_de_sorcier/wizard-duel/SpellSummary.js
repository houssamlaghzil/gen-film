// SpellSummary.js

import React from 'react';
import OpponentStatus from './OpponentStatus';

console.log('SpellSummary component loaded');

const SpellSummary = ({ summary, handleReadyToAttack, opponentData }) => {
    console.log('Rendering SpellSummary with summary:', summary);

    return (
        <div>
            <h2>Spell Summary</h2>
            <p>{summary}</p>
            <button onClick={handleReadyToAttack}>Ready to Attack</button>
            <OpponentStatus opponentData={opponentData} />
        </div>
    );
};

export default SpellSummary;
