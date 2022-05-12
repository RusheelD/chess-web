import { GameContext, TileInfo } from "../models/core";

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
        if (this.isValidMove(selectedTile!, tile)) {
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

        return changedTiles;
    }

    movePiece(selectedTile: TileInfo, targetTile: TileInfo): TileInfo[] {
        targetTile.piece = selectedTile.piece;
        selectedTile.piece = undefined;

        return [selectedTile, targetTile];
    }

    isValidMove(selectedTile: TileInfo, targetTile: TileInfo): boolean {
        if (selectedTile && selectedTile.piece && targetTile && targetTile.piece && targetTile.piece.color !== selectedTile.piece.color) {
            return true;
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
}
