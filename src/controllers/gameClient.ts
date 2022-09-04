import { getDead, loadBoard, loadLocations } from "../models";
import { GameContext, Move, TileInfo } from "../models/core";
import { log } from "../utils";
import {
  getAllValidMoves,
  kingsInCheck,
  pieceControllers,
  stalemate,
} from "./piece";
import {
  checkCastleAndGetRook,
  checkEnpassantKillAndGetDeadTile,
} from "./piece";

export class GameClient {
  gameContext: GameContext;
  updateCallback?: () => void;
  playerTurnChangeCallback?: () => void;

  constructor(gameContext: GameContext) {
    this.gameContext = gameContext;
    this.initialize();
  }

  async initialize(): Promise<void> {
    let res = await fetch("/make", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({ mode: "twoplayer" }),
    });
    let raw_data = await res.json();
    this.loadClient(raw_data);
  }

  async getBackendBoard(): Promise<void> {
    let res = await fetch("/board");
    let raw_data = await res.json();
    this.loadClient(raw_data);
  }

  loadClient(raw_data: any): void {
    let data = {
      fen: raw_data.board,
      possible: raw_data.possible,
      deadWhite: raw_data.dead_white,
      deadBlack: raw_data.dead_black,
      moveCounts: raw_data.move_counts,
      recent: raw_data.recent,
      currentPlayer: raw_data.current_player,
      currentTile: raw_data.current_piece,
      check: raw_data.check,
      checkmate: raw_data.checkmate,
      stalemate: raw_data.stalemate,
    };
    console.log(data);
    if (data.currentPlayer === "white") {
      this.gameContext.playerToPlay = this.gameContext.game.firstPlayer;
      if (this.playerTurnChangeCallback) {
        this.playerTurnChangeCallback();
      }
    }
    if (data.currentPlayer === "black") {
      this.gameContext.playerToPlay = this.gameContext.game.secondPlayer;
      if (this.playerTurnChangeCallback) {
        this.playerTurnChangeCallback();
      }
    }

    this.gameContext.board.deadWhite = {
      color: "white",
      pieces: getDead(data.deadWhite),
    };
    this.gameContext.board.deadBlack = {
      color: "black",
      pieces: getDead(data.deadBlack),
    };

    for (let file of [...Array(8)].map((_, k) => String.fromCharCode(k + 97))) {
      for (let rank = 1; rank <= 8; rank++) {
        let tile = this.gameContext.board.tiles.get(file + rank);
        if (tile) {
          tile.isPossibleMove = false;
          tile.isRecentlyMoved = false;
          tile.isSelected = false;
          tile.isCheck = false;
          tile.isCheckmate = false;
          tile.isStalemate = false;
        }
      }
    }

    this.gameContext.board.possibleMoves = loadLocations(
      this.gameContext.board,
      data.possible
    );
    for (let tile of this.gameContext.board.possibleMoves) {
      tile.isPossibleMove = true;
    }
    this.gameContext.board.recentMoves = loadLocations(
      this.gameContext.board,
      data.recent
    );
    for (let tile of this.gameContext.board.recentMoves) {
      tile.isRecentlyMoved = true;
    }
    for (let tile of loadLocations(this.gameContext.board, data.currentTile)) {
      tile.isSelected = true;
      this.gameContext.board.selectedTile = tile;
    }
    for (let tile of loadLocations(this.gameContext.board, data.check)) {
      tile.isCheck = true;
      this.gameContext.board.inCheck = tile;
    }
    for (let tile of loadLocations(this.gameContext.board, data.checkmate)) {
      tile.isCheckmate = true;
      this.gameContext.board.inCheck = tile;
    }
    for (let tile of loadLocations(this.gameContext.board, data.stalemate)) {
      tile.isStalemate = true;
    }

    loadBoard(data.fen, data.moveCounts, this.gameContext.board);
    this.gameContext.board = { ...this.gameContext.board };
    this.updateBoard();
  }

  // The following are the handlers for various events
  // This part needs heavy refactoring ...
  handleSelectTile(tile: TileInfo): void {
    let tilesToUpdate = [];
    let selectedTile = this.gameContext.board.selectedTile;
    fetch("/select", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({ tile: tile.file + tile.rank }),
    });

    // No selected tile and clicked on an empty tile
    // do nothing
    if (!selectedTile && !tile.piece) {
      return;
    }

    // If no selected tile and clicked on own color
    // select the tile
    if (
      !selectedTile &&
      tile.piece?.color === this.gameContext.playerToPlay.colorChosen
    ) {
      tilesToUpdate.push(...this.selectTile(tile));
      this.updateTilesOnBoard(
        tilesToUpdate,
        false,
        this.gameContext.board.selectedTile
      );
      return;
    }

    // If clicked on an already selected tile
    // then unselect
    if (selectedTile === tile) {
      tilesToUpdate.push(...this.unselectTile());
      this.updateTilesOnBoard(
        tilesToUpdate,
        false,
        this.gameContext.board.selectedTile
      );
      return;
    }

    // If selected tile exists and clicked on another own piece
    // then switch selection
    if (
      selectedTile &&
      tile.piece?.color === this.gameContext.playerToPlay.colorChosen
    ) {
      tilesToUpdate.push(...this.unselectTile());
      tilesToUpdate.push(...this.selectTile(tile));
      this.updateTilesOnBoard(
        tilesToUpdate,
        false,
        this.gameContext.board.selectedTile
      );
      return;
    }

    // Handle moving pieces now
    if (this.isValidMove(tile)) {
      tilesToUpdate.push(...this.movePiece(selectedTile!, tile));
      tilesToUpdate.push(...this.unselectTile());
      kingsInCheck(this.gameContext.game, this.gameContext.board);
      stalemate(this.gameContext.game, this.gameContext.board);
      let king = this.gameContext.board.inCheck;
      let kings = this.gameContext.board.inStalemate;
      if (king) {
        if (
          getAllValidMoves(
            this.gameContext.game,
            this.gameContext.board,
            king.piece!.color
          ).length === 0
        ) {
          king.isCheckmate = true;
          tilesToUpdate.push(king);
        } else {
          king.isCheck = true;
          tilesToUpdate.push(king);
        }
      }
      if (kings) {
        kings.forEach((king) => {
          king.isStalemate = true;
          tilesToUpdate.push(king);
        });
      }
      this.updateTilesOnBoard(
        tilesToUpdate,
        true,
        this.gameContext.board.selectedTile
      );
      return;
    }
  }

  updateBoard() {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  updateTilesOnBoard(
    changedTiles: TileInfo[],
    moveComplete: boolean,
    selectedTile?: TileInfo
  ) {
    const updatedTiles = new Map<string, TileInfo>(
      this.gameContext.board.tiles
    );
    changedTiles.forEach((t) => updatedTiles.set(t.file + t.rank, t));

    this.gameContext.board = {
      ...this.gameContext.board,
      selectedTile,
      tiles: updatedTiles,
    };

    // If move is completed update the turns and call the handler
    if (moveComplete) {
      this.gameContext.playerToPlay =
        this.gameContext.playerToPlay.user?.id ===
        this.gameContext.game.firstPlayer.user?.id
          ? this.gameContext.game.secondPlayer
          : this.gameContext.game.firstPlayer;
      this.unselectTile();

      if (this.playerTurnChangeCallback) {
        this.playerTurnChangeCallback();
      }
    }

    this.updateBoard();
  }

  // utility function
  unselectTile(): TileInfo[] {
    let changedTiles: TileInfo[] = [];

    for (let file of [...Array(8)].map((_, k) => String.fromCharCode(k + 97))) {
      for (let rank = 1; rank <= 8; rank++) {
        let tile = this.gameContext.board.tiles.get(file + rank);
        if (tile) {
          tile.isPossibleMove = false;
          tile.isSelected = false;
          changedTiles.push(tile);
          if (tile !== this.gameContext.board.inCheck) {
            tile.isCheck = false;
            tile.isCheckmate = false;
          }
          if (!this.gameContext.board.inStalemate?.includes(tile)) {
            tile.isStalemate = false;
          }
        }
      }
    }

    this.gameContext.board.possibleMoves = [];

    if (this.gameContext.board.selectedTile) {
      changedTiles.push(this.gameContext.board.selectedTile);
      this.gameContext.board.selectedTile.isSelected = false;
      this.gameContext.board.selectedTile = undefined;
    }

    return changedTiles;
  }

  selectTile(tile: TileInfo): TileInfo[] {
    let changedTiles: TileInfo[] = [];

    changedTiles.push(tile);
    tile.isSelected = true;
    this.gameContext.board.selectedTile = tile;

    let validMoves: TileInfo[] = pieceControllers
      .get(tile.piece!.name)
      ?.computeValidMoves(this.gameContext.game, this.gameContext.board, tile)!;
    console.log(validMoves);

    for (let moveTile of validMoves) {
      moveTile.isPossibleMove = true;
      changedTiles.push(moveTile);
    }

    this.gameContext.board.possibleMoves = validMoves;
    return changedTiles;
  }

  async reset(): Promise<void> {
    let res = await fetch("/reset");
    let raw_data = await res.json();
    this.loadClient(raw_data);
  }

  // computeValidMoves(): TileInfo[] {
  //   let data = { possible: "" };
  //   await fetch("/board").then((res) =>
  //     res.json().then((raw_data) => {
  //       data.possible = raw_data.possible;
  //     })
  //   );
  //   return loadLocations(this.gameContext.board, data.possible);
  //   return [];
  // }

  movePiece(selectedTile: TileInfo, targetTile: TileInfo): TileInfo[] {
    let changedTiles: TileInfo[] = [];

    // Clear the previous moves
    for (let tile of this.gameContext.board.recentMoves) {
      tile.isRecentlyMoved = false;
    }

    // Special kill for enpassant
    let enpassantKill = checkEnpassantKillAndGetDeadTile(
      this.gameContext.game,
      this.gameContext.board,
      selectedTile,
      targetTile
    );
    if (enpassantKill && enpassantKill.piece) {
      enpassantKill.piece.isDead = true;
      enpassantKill.piece.color === "white"
        ? this.gameContext.board.deadWhite.pieces.push(enpassantKill.piece)
        : this.gameContext.board.deadBlack.pieces.push(enpassantKill.piece);
      enpassantKill.piece.currentTile = undefined;
      enpassantKill.piece = undefined;
      changedTiles.push(enpassantKill);
    }

    // Make the move and assign the piece
    selectedTile.piece!.moveCount! += 1;
    if (targetTile.piece) {
      targetTile.piece.isDead = true;
      targetTile.piece.color === "white"
        ? this.gameContext.board.deadWhite.pieces.push(targetTile.piece)
        : this.gameContext.board.deadBlack.pieces.push(targetTile.piece);
      targetTile.piece.currentTile = undefined;
    }
    targetTile.piece = selectedTile.piece;
    targetTile.isRecentlyMoved = true;
    targetTile.piece!.currentTile = targetTile;
    selectedTile.piece = undefined;
    selectedTile.isRecentlyMoved = true;

    // Special move for castling
    let castle = checkCastleAndGetRook(
      this.gameContext.board,
      selectedTile,
      targetTile
    );
    if (castle) {
      castle[1].piece = castle[0].piece!;
      castle[0].piece!.moveCount! += 1;
      castle[0].piece = undefined;
      castle[0].isRecentlyMoved = true;
      castle[1].isRecentlyMoved = true;
      castle[1].piece!.currentTile = castle[1];
      changedTiles.push(...castle);
    }

    this.addMoveToGame(selectedTile, targetTile);
    this.gameContext.board.recentMoves = [
      selectedTile,
      targetTile,
      ...(castle ? castle : []),
    ];
    changedTiles.push(selectedTile, targetTile);

    return changedTiles;
  }

  isValidMove(targetTile: TileInfo): boolean {
    for (let tile of this.gameContext.board.possibleMoves) {
      if (tile === targetTile) {
        return true;
      }
    }

    return false;
  }

  // Update handlers
  setPlayerTurnChangeHandler(handler: () => void) {
    this.playerTurnChangeCallback = handler;
  }

  setBoardUpdateHandler(handler: () => void) {
    this.updateCallback = handler;
  }

  // Update game objects
  addMoveToGame(fromTile: TileInfo, toTile: TileInfo) {
    const move: Move = {
      from: fromTile.file + fromTile.rank,
      to: toTile.file + toTile.rank,
      piece: toTile.piece!,
      isCheck: false,
      isCastling: false,
      isCheckMate: false,
    };

    log(move);
    this.gameContext.game.moves.push(move);
  }
}
