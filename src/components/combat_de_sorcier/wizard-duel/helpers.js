// helpers.js

import { PLAYER_STATUSES } from './constants';

// Function to generate a spell summary from evaluation data
export const generateSpellSummary = (evaluation) => {
    console.log('Generating spell summary with evaluation:', evaluation);
    let summary = `Your spell will cost ${evaluation.manaCost} mana and deal ${evaluation.damage} damage to the opponent.`;

    if (evaluation.damageOverTime) {
        summary += ' It also deals damage over time.';
    }

    if (evaluation.terrainModification) {
        summary += ` It modifies the terrain: ${evaluation.terrainModification}`;
    }

    return summary;
};

// Function to get a human-readable opponent status
export const getOpponentStatus = (opponentData) => {
    console.log('Getting opponent status for data:', opponentData);
    if (!opponentData) return 'Opponent not connected';

    switch (opponentData.status) {
        case PLAYER_STATUSES.WRITING:
            return 'Opponent is writing their spell';
        case PLAYER_STATUSES.REVIEWING:
            return 'Opponent is reviewing their spell';
        case PLAYER_STATUSES.READY:
            return 'Opponent is ready to attack';
        case PLAYER_STATUSES.NEXT_ROUND:
            return 'Opponent is ready for next round';
        default:
            return 'Unknown opponent status';
    }
};

console.log('helpers.js loaded');
