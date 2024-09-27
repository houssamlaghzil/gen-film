// CombatPhase.js

import React from 'react';

console.log('CombatPhase component loaded');

const CombatPhase = ({ handleCombat }) => {
    console.log('Rendering CombatPhase');

    return (
        <div>
            <h2>Combat Phase</h2>
            <p>Resolving combat...</p>
            <button onClick={handleCombat}>Resolve Combat</button>
        </div>
    );
};

export default CombatPhase;
