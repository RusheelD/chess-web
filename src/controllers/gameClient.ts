import { getDead, loadBoard, loadValidMoves } from "../models";
import { GameContext, Move, TileInfo } from "../models/core";
import { log } from "../utils";
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
  }

  async initialize(): Promise<void> {
    await fetch("/make", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({ mode: "twoplayer" }),
    });
  }

  // The following are the handlers for various events
  // This part needs heavy refactoring ...
  async handleSelectTile(tile: TileInfo): Promise<void> {
    let tilesToUpdate = [];
    let selectedTile = this.gameContext.board.selectedTile;
    await fetch("/select", {
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
      tilesToUpdate.push(...(await this.selectTile(tile)));
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
      tilesToUpdate.push(...(await this.selectTile(tile)));
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
      this.updateTilesOnBoard(
        tilesToUpdate,
        true,
        this.gameContext.board.selectedTile
      );
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

    for (let tile of this.gameContext.board.possibleMoves) {
      tile.isPossibleMove = false;
      changedTiles.push(tile);
    }

    this.gameContext.board.possibleMoves = [];

    if (this.gameContext.board.selectedTile) {
      changedTiles.push(this.gameContext.board.selectedTile);
      this.gameContext.board.selectedTile.isSelected = false;
      this.gameContext.board.selectedTile = undefined;
    }

    return changedTiles;
  }

  async selectTile(tile: TileInfo): Promise<TileInfo[]> {
    let changedTiles: TileInfo[] = [];

    changedTiles.push(tile);
    tile.isSelected = true;
    this.gameContext.board.selectedTile = tile;

    let validMoves: TileInfo[] = await this.computeValidMoves();
    console.log(validMoves);

    for (let moveTile of validMoves) {
      console.log(moveTile);
      moveTile.isPossibleMove = true;
      changedTiles.push(moveTile);
    }

    this.gameContext.board.possibleMoves = validMoves;
    return changedTiles;
  }

  async reset(): Promise<void> {
    let data = {
      fen: "",
      deadWhite: "",
      deadBlack: "",
      moveCounts: "",
    };
    let res = await fetch("/reset");
    let raw_data = await res.json();
    data = {
      fen: raw_data.board,
      deadWhite: raw_data.dead_white,
      deadBlack: raw_data.dead_black,
      moveCounts: raw_data.move_counts,
    };

    if (this.gameContext.playerToPlay === this.gameContext.game.secondPlayer) {
      this.gameContext.playerToPlay = this.gameContext.game.firstPlayer;
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
    this.gameContext.board.recentMoves = [];
    for (let file of [...Array(8)].map((_, k) => String.fromCharCode(k + 97))) {
      for (let rank = 1; rank <= 8; rank++) {
        let tile = this.gameContext.board.tiles.get(file + rank);
        if (tile) {
          tile.isPossibleMove = false;
          tile.isRecentlyMoved = false;
          tile.isSelected = false;
        }
      }
    }
    loadBoard(data.fen, data.moveCounts, this.gameContext.board);
  }

  async computeValidMoves(): Promise<TileInfo[]> {
    let data = { possible: "" };
    await fetch("/board").then((res) =>
      res.json().then((raw_data) => {
        data.possible = raw_data.possible;
      })
    );
    return loadValidMoves(this.gameContext.board, data.possible);
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
