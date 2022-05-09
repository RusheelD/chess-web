// Defines the core models for chess web

export interface PieceInfo {
    color: string;
    name: string;
}

export interface Move {
    from: string;   // Is in the form a1 or a8
    to: string;     // is in the form b2 or c7
    isCheck: boolean;
    isCastling: boolean;
    isCheckMate: boolean;
}

export interface Player {
    name: string;
    colorChosen: string;
    isComputer: boolean;
}

export interface IChessGame {
    moves: Move[];  // all the moves made so far in the game
    firstPlayer: Player;
    secondPlayer: Player;
}
