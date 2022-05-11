import { timeEnd } from "console";
import { GameContext, GameMode, Player, TileInfo } from "./core";

export class GameClient {
    gameContext: GameContext;
    updateHandler?: () => void;
    playerTurnChangeHandler?: () => void;

    constructor(gameContext: GameContext) {
        this.gameContext = gameContext;
    }

    // This part needs heavy refactoring ...
    selectTile(tile: TileInfo): void {
        let selectedTile = this.gameContext.board.selectedTile;

        if (!this.canSelectTile(tile)) {
            return;
        }

        let tilesToUpdate = [];
        let moveComplete = false;

        if (selectedTile === tile || (selectedTile && !tile.piece)) {  // handle unselect
            tilesToUpdate.push(selectedTile);
            this.unselectTile();
        } else {
            tilesToUpdate.push(tile);

            if (selectedTile) {
                selectedTile.isSelected = false;
                tilesToUpdate.push(selectedTile);

                // Swap the piece
                tile.piece = selectedTile.piece;
                selectedTile.piece = undefined;
                moveComplete = true;
            }

            // update selection
            tile.isSelected = true;

            // clear old selection and piece
            selectedTile = tile;
        }

        this.updateTilesOnBoard(tilesToUpdate, moveComplete, selectedTile);
    }

    updateBoard() {
        if (this.updateHandler) {
            this.updateHandler();
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

            if (this.playerTurnChangeHandler) {
                this.playerTurnChangeHandler();
            }
        }

        this.updateBoard();
    }

    // utility function
    unselectTile(): void {
        if (this.gameContext.board.selectedTile) {
            this.gameContext.board.selectedTile.isSelected = false;
            this.gameContext.board.selectedTile = undefined;
        }
    }

    canSelectTile(tile: TileInfo): boolean {
        let selectedTile = this.gameContext.board.selectedTile;

        // A temporary hack to prevent taking own pieces
        if (selectedTile !== tile && selectedTile && selectedTile.piece && selectedTile.piece.color === tile.piece?.color) {
            return false;
        }

        // No current selected tile and target tile doesn't have a piece
        if (!selectedTile && !tile.piece) {
            return false;
        }

        // No previously selected tile, game mode is classic, and piece is not your color
        if (this.gameContext.game.mode === GameMode.Classic
            && !selectedTile
            && tile.piece
            && tile.piece.color !== this.gameContext.playerToPlay.colorChosen) {
            return false;
        }

        return true;
    }

    // Update handlers
    setPlayerTurnChangeHandler(handler: () => void) {
        this.playerTurnChangeHandler = handler;
    }

    setBoardUpdateHandler(handler: () => void) {
        this.updateHandler = handler;
    }
}
