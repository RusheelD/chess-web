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
  gameStartedCallback?: () => void;
  gameEndedCallback?: () => void;

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
    this.updateGameStarted();
    this.updateGameOver();
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

    this.gameContext.game.isOver = false;
    this.gameContext.game.isStarted = false;
    this.gameContext.board.inCheck = undefined;
    this.gameContext.board.inStalemate = undefined;
    this.gameContext.board.inPromotion = undefined;
    this.gameContext.board.pending = undefined;
    this.gameContext.board.promotionChoice = undefined;

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
      this.gameContext.game.isOver = true;
    }
    for (let tile of loadLocations(this.gameContext.board, data.stalemate)) {
      tile.isStalemate = true;
      this.gameContext.game.isOver = true;
    }

    loadBoard(
      data.fen,
      data.moveCounts,
      this.gameContext.board,
      this.gameContext.game
    );
    this.gameContext.board = { ...this.gameContext.board };
    this.updateBoard();
  }

  handleSelectPromotion(tile: TileInfo): void {
    if (this.gameContext.board.inPromotion) {
      this.gameContext.board.promotionChoice = tile.piece!.name;
      console.log(tile);
      this.handleSelectTile(this.gameContext.board.pending!);
    }
  }

  // The following are the handlers for various events
  // This part needs heavy refactoring ...
  handleSelectTile(tile: TileInfo): void {
    let tilesToUpdate = [];
    let selectedTile = this.gameContext.board.selectedTile;

    if (
      selectedTile &&
      selectedTile.piece!.name === "pawn" &&
      this.isValidMove(tile) &&
      !this.gameContext.board.inPromotion &&
      !this.gameContext.board.promotionChoice
    ) {
      if (tile.rank === "1" && selectedTile.piece!.color === "black") {
        this.gameContext.board.inPromotion = selectedTile;
        this.gameContext.board.pending = tile;
        this.gameContext.board.promotionChoice = undefined;
        this.gameContext.board.promotion = {
          color: this.gameContext.board.inPromotion.piece!.color,
          location:
            this.gameContext.board.inPromotion.file +
            this.gameContext.board.inPromotion.rank,
        };
        this.updateBoard();
        return;
      }
      if (tile.rank === "8" && selectedTile.piece!.color === "white") {
        this.gameContext.board.inPromotion = selectedTile;
        this.gameContext.board.pending = tile;
        this.gameContext.board.promotionChoice = undefined;
        this.gameContext.board.promotion = {
          color: this.gameContext.board.inPromotion.piece!.color,
          location:
            this.gameContext.board.inPromotion.file +
            this.gameContext.board.inPromotion.rank,
        };
        this.updateBoard();
        return;
      }
    }

    if (
      this.gameContext.board.inPromotion &&
      !this.gameContext.board.promotionChoice
    ) {
      return;
    } else {
      this.gameContext.board.inPromotion = undefined;
    }

    let promoChoice = this.gameContext.board.promotionChoice;

    let choice = promoChoice
      ? promoChoice.charAt(0).toUpperCase() + promoChoice.substring(1)
      : "";

    fetch("/select", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        tile: tile.file + tile.rank,
        choice: choice ? choice : "Queen",
      }),
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
        this.gameContext.game.isOver = true;
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
        this.gameContext.game.isOver = true;
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

    this.gameContext.board.inPromotion = undefined;
    this.gameContext.board.promotionChoice = undefined;
    this.gameContext.board.pending = undefined;
    this.gameContext.board.promotion = {
      color: "",
      location: "",
    };
  }

  updateBoard() {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  updateGameStarted() {
    if (this.gameStartedCallback) {
      this.gameStartedCallback();
    }
  }

  updateGameOver() {
    if (this.gameEndedCallback) {
      this.gameEndedCallback();
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
      let checkmate =
        this.gameContext.board.inCheck &&
        getAllValidMoves(
          this.gameContext.game,
          this.gameContext.board,
          this.gameContext.board.inCheck.piece!.color
        ).length === 0;
      let stalemate = this.gameContext.board.inStalemate !== undefined;
      if (checkmate || stalemate) {
        if (this.gameEndedCallback) {
          this.gameEndedCallback();
        }
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
    this.updateGameStarted();
    this.updateGameOver();
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

    // Auto-Promote Pawn to Queen
    if (targetTile.piece?.name === "pawn") {
      if (
        (targetTile.rank === "8" && targetTile.piece.color === "white") ||
        (targetTile.rank === "1" && targetTile.piece.color === "black")
      ) {
        targetTile.piece.name = this.gameContext.board.promotionChoice
          ? this.gameContext.board.promotionChoice
          : "queen";
      }
    }

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

  setGameStartedHandler(handler: () => void) {
    this.gameStartedCallback = handler;
  }

  setGameEndedHandler(handler: () => void) {
    this.gameEndedCallback = handler;
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
