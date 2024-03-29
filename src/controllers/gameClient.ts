import {
  GameMode,
  getDead,
  loadBoard,
  loadLocations,
  PlayMode,
} from "../models";
import { GameContext, Move, TileInfo, UserContext } from "../models/core";
import { log } from "../utils";
import {
  getAllValidMoves,
  kingsInCheck,
  pieceControllers,
  stalemate,
  checkCastleAndGetRook,
  checkEnpassantKillAndGetDeadTile,
} from "./piece";

import * as io from "socket.io-client";

export class GameClient {
  gameContext: GameContext;
  userContext: UserContext;
  updateCallback?: () => void;
  playerTurnChangeCallback?: () => void;
  gameStartedCallback?: () => void;
  gameEndedCallback?: () => void;
  loggedInCallback?: () => void;
  promotionChangeCallback?: () => void;
  socket: any;

  constructor(gameContext: GameContext, userContext: UserContext) {
    this.gameContext = gameContext;
    this.userContext = userContext;
    this.gameContext.game.isOver = false;
    this.updateGameOver();
    this.socket = io.connect("http://10.1.1.198:5000");
    let params = new URLSearchParams(window.location.search);
    if (params.has("code") && params.get("code") !== null) {
      this.gameContext.game.isStarted = true;
      this.gameContext.game.gameCode = params.get("code")!;
    } else {
      this.gameContext.game.isStarted = false;
    }
    if (params.has("gamemode") && params.get("gamemode") !== null) {
      let mode = params.get("gamemode")!;
      switch (mode) {
        case "Classic":
          this.gameContext.game.mode = GameMode.Classic;
          break;
        case "Synchronic":
          this.gameContext.game.mode = GameMode.Synchronic;
          break;
        default:
          this.gameContext.game.mode = GameMode.Classic;
      }
    }
    if (params.has("playmode") && params.get("playmode") !== null) {
      let mode = params.get("playmode")!;
      switch (mode) {
        case "pass":
          this.gameContext.playMode = PlayMode.PassAndPlay;
          break;
        case "network":
          this.gameContext.playMode = PlayMode.Network;
          break;
        case "ai":
          this.gameContext.playMode = PlayMode.WithComputer;
          break;
        default:
          this.gameContext.playMode = PlayMode.PassAndPlay;
      }
    }
    if (params.has("usercode") && params.get("usercode") !== null) {
      let userCode = params.get("usercode");
      this.userContext.user.code = userCode!;
      this.userContext.user.isLogged = true;
    }
    this.initialize();
  }

  addUser(): void {
    fetch("/add", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        code: this.userContext.user.code,
        name: this.userContext.user.name,
        id: this.userContext.user.id,
      }),
    });
  }

  async initialize(): Promise<void> {
    let gamemode;
    let playmode;
    switch (
      this.gameContext.game.mode ? this.gameContext.game.mode : GameMode.Classic
    ) {
      case GameMode.Classic:
        gamemode = "classic";
        break;
      case GameMode.Synchronic:
        gamemode = "synchronic";
        break;
      default:
        gamemode = "classic";
        break;
    }
    switch (this.gameContext.playMode) {
      case PlayMode.PassAndPlay:
        playmode = "pass";
        break;
      case PlayMode.Network:
        playmode = "network";
        break;
      case PlayMode.WithComputer:
        playmode = "ai";
        break;
      default:
        playmode = "pass";
        break;
    }
    if (
      this.gameContext.game.gameCode &&
      this.gameContext.game.gameCode !== ""
    ) {
      let res = await fetch("/make", {
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          mode: gamemode,
          type: playmode,
          code: this.gameContext.game.gameCode
            ? this.gameContext.game.gameCode
            : "",
          usercode: this.userContext.user.code,
          logged: this.userContext.user.isLogged,
        }),
      });
      let raw_data = await res.json();
      this.loadClient(raw_data);
      this.updateGameStarted();
      this.updateGameOver();
    }
    this.updateLogged();
  }

  async getBackendBoard(): Promise<void> {
    let res = await fetch("/board", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        mode: "twoplayer",
        code: this.gameContext.game.gameCode
          ? this.gameContext.game.gameCode
          : "",
        usercode: this.userContext.user.code,
      }),
    });
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
      logged: raw_data.logged,
      users: raw_data.users,
    };
    let user = data.users[this.userContext.user.code];
    this.userContext.user.name = user.name;
    if (user.userId !== undefined) {
      this.userContext.user.id = user.userId;
    }
    if (user.color === "white") {
      this.gameContext.game.firstPlayer.user = this.userContext.user;
    } else if (user.color === "black") {
      this.gameContext.game.secondPlayer.user = this.userContext.user;
    }

    for (let code in data.users) {
      let u = data.users[code];
      if (u.color !== user.color) {
        if (u.color === "white") {
          this.gameContext.game.firstPlayer.user = {
            name: u.name,
            code: code,
            id: "",
            isLogged: true,
          };
        } else if (u.color === "black") {
          this.gameContext.game.secondPlayer.user = {
            name: u.name,
            code: code,
            id: "",
            isLogged: true,
          };
        }
      }
    }

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

    this.gameContext.board.inCheck = undefined;
    this.gameContext.board.inStalemate = undefined;
    this.gameContext.board.inPromotion = undefined;
    this.gameContext.board.pending = undefined;
    this.gameContext.board.promotionChoice = undefined;
    this.gameContext.board.promotion = {
      color: "",
      location: "q9",
    };

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
    if (
      this.gameContext.playMode !== PlayMode.PassAndPlay &&
      this.gameContext.playerToPlay.user !== this.userContext.user
    ) {
      return;
    }
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
        this.updatePromotion();
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
        this.updatePromotion();
        this.updateBoard();
        return;
      }
    }

    if (
      this.gameContext.board.inPromotion &&
      !this.gameContext.board.promotionChoice
    ) {
      this.updatePromotion();
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
        choice: choice, // ? choice : "Queen",
        code: this.gameContext.game.gameCode
          ? this.gameContext.game.gameCode
          : "",
      }),
    });

    this.socket.emit("select", tile.file + tile.rank);

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
    }

    this.gameContext.board.inPromotion = undefined;
    this.gameContext.board.promotionChoice = undefined;
    this.gameContext.board.pending = undefined;
    this.gameContext.board.promotion = {
      color: "",
      location: "q9",
    };
    this.updatePromotion();
    this.updateBoard();
  }

  updateBoard() {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  updatePromotion() {
    if (this.promotionChangeCallback) {
      this.promotionChangeCallback();
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

  updateLogged() {
    if (this.loggedInCallback) {
      this.loggedInCallback();
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
    window.location.href =
      window.location.protocol + "/?usercode=" + this.userContext.user.code;
    let res = await fetch("/reset", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        mode: "twoplayer",
        code: this.gameContext.game.gameCode
          ? this.gameContext.game.gameCode
          : "",
        userCode: this.userContext.user.code,
      }),
    });
    let raw_data = await res.json();
    this.loadClient(raw_data);
    this.updateGameStarted();
    this.updateGameOver();
    this.updateLogged();
  }

  async logout(): Promise<void> {
    window.location.href = window.location.protocol + "/";
    let res = await fetch("/logout", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        mode: "twoplayer",
        usercode: this.userContext.user.code,
        code: this.gameContext.game.gameCode
          ? this.gameContext.game.gameCode
          : "",
        userCode: this.userContext.user.code,
      }),
    });
    this.userContext.user.isLogged = false;
    let raw_data = await res.json();
    console.log(raw_data);
    this.loadClient(raw_data);
    this.updateGameStarted();
    this.updateGameOver();
    this.updateLogged();
  }

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

  setPromotionChangeHandler(handler: () => void) {
    this.promotionChangeCallback = handler;
  }

  setLoggedHandler(handler: () => void) {
    this.loggedInCallback = handler;
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
