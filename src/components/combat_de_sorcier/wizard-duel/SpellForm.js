// SpellForm.js

import React from 'react';

console.log('SpellForm component loaded');

const SpellForm = ({ playerData, setPlayerData, handleSpellSubmit }) => {
    console.log('Rendering SpellForm with playerData:', playerData);

    // Ensure 'spell' is defined with default values
    const spell = playerData.spell || {
        category: 'Attack',
        description: '',
        evaluation: null,
        summary: null,
    };

    return (
        <div>
            <h2>Prepare Your Spell</h2>
            <select
                value={spell.category}
                onChange={(e) =>
                    setPlayerData({
                        ...playerData,
                        spell: { ...spell, category: e.target.value },
                    })
                }
            >
                <option>Attack</option>
                <option>Invocation</option>
                <option>Terrain Alteration</option>
            </select>
            <textarea
                value={spell.description}
                onChange={(e) =>
                    setPlayerData({
                        ...playerData,
                        spell: { ...spell, description: e.target.value },
                    })
                }
            />
            <button onClick={handleSpellSubmit}>Submit Spell</button>
        </div>
    );
};

export default SpellForm;

