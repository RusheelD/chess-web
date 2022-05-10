// Defines the core models for chess web

import { GameClient } from "./gameClient";

export enum PlayMode {
    PassAndPlay,
    Network,
    WithComputer,
}

export enum GameMode {
    Classic,
    Synchronic
}

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
    mode?: GameMode;
    moves: Move[];  // all the moves made so far in the game
    firstPlayer: Player;
    secondPlayer: Player;
}

export interface GameContext {
    game: ChessGame;
    board: BoardInfo;
    playMode: PlayMode;
}

export interface UserContext {
    gameContext?: GameContext;
    gameClient?: GameClient;
    enableTestMode: boolean;
}

export interface BoardProps extends BoardInfo {
    gameClient?: GameClient;
    onSelectTile(tile: TileInfo): void;
}

export interface TileProps extends TileInfo {
    onSelect(): void;
}
