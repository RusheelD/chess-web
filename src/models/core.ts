// Defines the core models for chess web

import { BoardProps } from "../components/boards/Board";
import { gameClient } from "./gameClient";

export interface PieceInfo {
    color: string;
    name: string;
}

export interface TileInfo {
    rank: string;
    file: string;
    piece?: PieceInfo;
    isSelected?: boolean;
}

export interface Board {
    tiles: TileInfo[];
    pieces: PieceInfo[];
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
    board: Board;
}

export interface UserContext {
    gameContext?: GameContext;
    gameClient?: gameClient;
}

