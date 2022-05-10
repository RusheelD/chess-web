import { GameContext, Player, TileInfo } from "./core";

export class GameClient {
    gameContext: GameContext;
    updateHandler?: () => void;

    constructor(gameContext: GameContext) {
        this.gameContext = gameContext;
    }

    // This part needs heavy refactoring ...
    selectTile (tile: TileInfo): void {
        let selectedTile = this.gameContext.board.selectedTile;

        // A temporary hack to prevent taking own pieces
        if (selectedTile !== tile && selectedTile && selectedTile.piece && selectedTile.piece.color === tile.piece?.color) {
            return;
        }

        // No current selected tile and target tile doesn't have a piece
        if (!selectedTile && !tile.piece) {
            return;
        }

        let tilesToUpdate = [];
        let moveComplete = false;

        if (selectedTile === tile || (selectedTile && !tile.piece)) {  // handle unselect
            tilesToUpdate.push(selectedTile);
            selectedTile.isSelected = false;
            selectedTile = undefined;
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

    setBoardUpdateHandler(handler: () => void) {
        this.updateHandler = handler;
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
            isFlipped: moveComplete ? !this.gameContext.board.isFlipped : this.gameContext.board.isFlipped,
            selectedTile,
            tiles: updatedTiles,
        }

        this.updateBoard();
    }
}
