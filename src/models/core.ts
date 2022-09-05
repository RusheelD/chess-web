// Defines the core models for chess web

import { GameClient } from "../controllers";

export enum PlayMode {
  PassAndPlay,
  Network,
  WithComputer,
}

export enum GameMode {
  Classic,
  Synchronic,
}

export interface StartInfo {
  context: UserContext;
  updateStart: (x: boolean) => void;
}

export interface EndInfo {
  context: UserContext;
}

export interface PieceInfo {
  color: string;
  name: string;
  isDead: boolean;
  moveCount: number;
  currentTile?: TileInfo;
}

export interface TileInfo {
  rank: string;
  file: string;
  piece?: PieceInfo;
  isSelected: boolean;
  isRecentlyMoved: boolean;
  isPossibleMove: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isPromotion: boolean;
  isTransparent: boolean;
}

export interface BoardInfo {
  tiles: Map<string, TileInfo>;
  pieces: PieceInfo[];
  selectedTile?: TileInfo;
  recentMoves: TileInfo[];
  possibleMoves: TileInfo[];
  deadBlack: DeadInfo;
  deadWhite: DeadInfo;
  inCheck?: TileInfo;
  inStalemate?: TileInfo[];
}

export interface DeadInfo {
  color: string;
  pieces: PieceInfo[];
}

export interface PromotionInfo {
  color: string;
  location: string;
  onSelectPromotion(tile: TileInfo): void;
}

export interface Move {
  from: string; // Is in the form a1 or a8
  to: string; // is in the form b2 or c7
  piece: PieceInfo;
  isCheck: boolean;
  isCastling: boolean;
  isCheckMate: boolean;
}

export interface User {
  id: string;
  name: string;
}

export interface Player {
  user?: User;
  colorChosen: string;
  isComputer: boolean;
}

export interface ChessGame {
  mode?: GameMode;
  moves: Move[]; // all the moves made so far in the game
  firstPlayer: Player;
  secondPlayer: Player;
  isOver: boolean;
  isStarted: boolean;
}

export interface GameContext {
  game: ChessGame;
  board: BoardInfo;
  playMode: PlayMode;
  playerToPlay: Player;
}

// The following models use game client as properties. THis isn't really a good
// structure.
// TODO: Figure out a structure to remove from here and use it directly in the App
export interface UserContext {
  user: User;
  gameContext?: GameContext;
  gameClient?: GameClient;
  enableTestMode: boolean;
}

export interface BoardProps extends BoardInfo {
  gameClient?: GameClient;
  resetKey: boolean;
  onSelectTile(tile: TileInfo): void;
}

export interface TileProps extends TileInfo {
  onSelect(): void;
}
