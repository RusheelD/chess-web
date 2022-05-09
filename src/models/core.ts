// Defines the core models for chess web

import { gameClient } from "./gameClient";

export interface PieceInfo {
    color: string;
    name: string;
}

export interface TileInfo {
    rank: string;
    file: string;
    piece?: PieceInfo;
    isSelected: boolean;
}

export interface BoardInfo {
    tiles: Map<string, TileInfo>;
    pieces: PieceInfo[];
    isFlipped: boolean;
    selectedTile?: TileInfo;
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

export interface ChessGame {
    moves: Move[];  // all the moves made so far in the game
    firstPlayer: Player;
    secondPlayer: Player;
}

export interface GameContext {
    game: ChessGame;
    board: BoardInfo;
}

export interface UserContext {
    gameContext?: GameContext;
    gameClient?: gameClient;
}

