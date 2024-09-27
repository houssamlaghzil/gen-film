// openaiUtils.js

import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

console.log('openaiUtils.js loaded');

// Function to evaluate a spell using OpenAI
export const evaluateSpell = async (spellData) => {
    console.log('Evaluating spell with data:', spellData);

    const prompt = `
You are a spell evaluator for a wizard duel game. Given the player's health, mana, spell category, and spell description, evaluate the spell and return a JSON object with the following fields:

- "damageOverTime": boolean, indicates if the spell deals damage over time.
- "dotCancellationConditions": string[], conditions that can cancel the damage over time effect (empty if not applicable).
- "damage": number, the amount of damage the spell does if it hits the opponent.
- "manaCost": number, the amount of mana required to cast the spell.
- "selfDamage": number, the amount of damage the caster takes from their own spell (0 if none).
- "selfProtectionConditions": string[], conditions that prevent the caster from being harmed by their own spell (empty if not applicable).
- "terrainModification": string, description of terrain changes caused by the spell (empty if none).
- "terrainDuration": number, how long the terrain modification lasts in turns (0 if not applicable).
- "terrainCountermeasures": string[], ways the opponent can counter the terrain effect (empty if not applicable).

Please respond **only** with the JSON object and no additional text.

---

Player Health: ${spellData.health}
Player Mana: ${spellData.mana}
Spell Category: ${spellData.category}
Spell Description: ${spellData.description}
`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        const assistantMessage = response.data.choices[0].message.content.trim();
        console.log('Assistant response:', assistantMessage);

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(assistantMessage);
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            throw new Error('Invalid JSON response from OpenAI API');
        }

        return jsonResponse;
    } catch (error) {
        console.error('Error evaluating spell:', error);
        throw error;
    }
};

// Function to arbitrate combat using OpenAI
export const arbitrateCombat = async (combatData) => {
    console.log('Arbitrating combat with data:', combatData);

    const prompt = `
You are a combat arbiter for a wizard duel game. Given the combat data, decide the outcome of the spells cast by both players, considering active terrain modifications and summons. Return a JSON object with the following fields:

- "damageToPlayer": number, damage taken by the player.
- "damageToOpponent": number, damage taken by the opponent.
- "manaCostToPlayer": number, mana spent by the player.
- "manaCostToOpponent": number, mana spent by the opponent.
- "terrainEffects": string[], descriptions of any new terrain effects.
- "summons": string[], descriptions of any new summons.
- "combatNarration": string, a brief description of what happened during the combat.

Please respond **only** with the JSON object and no additional text.

---

Combat Data: ${JSON.stringify(combatData)}
`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        const assistantMessage = response.data.choices[0].message.content.trim();
        console.log('Assistant response:', assistantMessage);

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(assistantMessage);
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            throw new Error('Invalid JSON response from OpenAI API');
        }

        return jsonResponse;
    } catch (error) {
        console.error('Error arbitrating combat:', error);
        throw error;
    }
};
