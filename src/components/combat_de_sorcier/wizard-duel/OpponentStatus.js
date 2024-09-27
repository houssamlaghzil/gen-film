// OpponentStatus.js

import React from 'react';
import { getOpponentStatus } from './helpers';

console.log('OpponentStatus component loaded');

const OpponentStatus = ({ opponentData }) => {
    const statusMessage = getOpponentStatus(opponentData);
    console.log('Rendering OpponentStatus with message:', statusMessage);

    return <p>Opponent Status: {statusMessage}</p>;
};

export default OpponentStatus;
