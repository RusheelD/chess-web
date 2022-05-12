import { GameContext, Move, TileInfo } from "../models/core";
import { log } from "../utils";
import { checkCastleAndGetRook, checkEnpassantKillAndGetDeadTile, pieceControllers } from "./piece";

export class GameClient {
    gameContext: GameContext;
    updateCallback?: () => void;
    playerTurnChangeCallback?: () => void;

    constructor(gameContext: GameContext) {
        this.gameContext = gameContext;
    }

    // The following are the handlers for various events
    // This part needs heavy refactoring ...
    handleSelectTile(tile: TileInfo): void {
        let tilesToUpdate = [];
        let selectedTile = this.gameContext.board.selectedTile;

        // No selected tile and clicked on an empty tile
        // do nothing
        if (!selectedTile && !tile.piece) {
            return;
        }

        // If no selected tile and clicked on own color
        // select the tile
        if (!selectedTile && tile.piece?.color === this.gameContext.playerToPlay.colorChosen) {
            tilesToUpdate.push(...this.selectTile(tile));
            this.updateTilesOnBoard(tilesToUpdate, false, this.gameContext.board.selectedTile);
            return;
        }

        // If clicked on an already selected tile
        // then unselect
        if (selectedTile === tile) {
            tilesToUpdate.push(...this.unselectTile());
            this.updateTilesOnBoard(tilesToUpdate, false, this.gameContext.board.selectedTile);
            return;
        }

        // If selected tile exists and clicked on another own piece
        // then switch selection
        if (selectedTile && tile.piece?.color === this.gameContext.playerToPlay.colorChosen) {
            tilesToUpdate.push(...this.unselectTile());
            tilesToUpdate.push(...this.selectTile(tile));
            this.updateTilesOnBoard(tilesToUpdate, false, this.gameContext.board.selectedTile);
            return;
        }

        // Handle moving pieces now
        if (this.isValidMove(tile)) {
            tilesToUpdate.push(...this.movePiece(selectedTile!, tile));
            tilesToUpdate.push(...this.unselectTile());
            this.updateTilesOnBoard(tilesToUpdate, true, this.gameContext.board.selectedTile);
            return;
        }
    }

    updateBoard() {
        if (this.updateCallback) {
            this.updateCallback();
        }
    }

    updateTilesOnBoard(changedTiles: TileInfo[], moveComplete: boolean, selectedTile?: TileInfo) {
        const updatedTiles = new Map<string, TileInfo>(this.gameContext.board.tiles);
        changedTiles.forEach(t => updatedTiles.set(t.file + t?.rank, t));

        this.gameContext.board = {
            ...this.gameContext.board,
            selectedTile,
            tiles: updatedTiles,
        }

        // If move is completed update the turns and call the handler
        if (moveComplete) {
            this.gameContext.board.isFlipped = !this.gameContext.board.isFlipped;
            this.gameContext.playerToPlay = (this.gameContext.playerToPlay.user?.id === this.gameContext.game.firstPlayer.user?.id)
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

    selectTile(tile: TileInfo): TileInfo[] {
        let changedTiles: TileInfo[] = [];

        changedTiles.push(tile);
        tile.isSelected = true;
        this.gameContext.board.selectedTile = tile;

        // Compute valid moves
        const pieceController = pieceControllers.get(tile.piece!.name);
        let validMoves = pieceController
            ? pieceController.computeValidMoves(this.gameContext.game, this.gameContext.board, tile)
            : [];

        for (let moveTile of validMoves) {
            moveTile.isPossibleMove = true;
            changedTiles.push(moveTile);
        }

        this.gameContext.board.possibleMoves = validMoves;
        return changedTiles;
    }

    movePiece(selectedTile: TileInfo, targetTile: TileInfo): TileInfo[] {
        let changedTiles: TileInfo[] = [];

        // Clear the previous moves
        for (let tile of this.gameContext.board.recentMoves) {
            tile.isRecentlyMoved = false;
        }

        // Special kill for enpassant
        let enpassantKill = checkEnpassantKillAndGetDeadTile(this.gameContext.game, this.gameContext.board, selectedTile, targetTile);
        if (enpassantKill && enpassantKill.piece) {
            enpassantKill.piece.isDead = true;
            enpassantKill.piece.currentTile = undefined;
            enpassantKill.piece = undefined;
            changedTiles.push(enpassantKill);
        }

        // Make the move and assign the piece
        selectedTile.piece!.moveCount! += 1;
        if (targetTile.piece) {
            targetTile.piece.isDead = true;
            targetTile.piece.currentTile = undefined;
        }
        targetTile.piece = selectedTile.piece;
        targetTile.isRecentlyMoved = true;
        targetTile.piece!.currentTile = targetTile;
        selectedTile.piece = undefined;
        selectedTile.isRecentlyMoved = true;

        // Special move for castling
        let castle = checkCastleAndGetRook(this.gameContext.board, selectedTile, targetTile);
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
        this.gameContext.board.recentMoves = [selectedTile, targetTile, ...(castle ? castle : [])];
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
            isCheckMate: false
        }

        log(move);
        this.gameContext.game.moves.push(move);
    }
}
