import { GameContext, Player, TileInfo } from "./core";

export class gameClient {

    gameContext: GameContext;

    constructor(gameContext: GameContext) {
        this.gameContext = gameContext;
    }

    selectTile (tile: TileInfo): void {
        if(this.gameContext.board.selectedTile) {
            this.gameContext.board.selectedTile.isSelected = false;
        }
        tile.isSelected = true;
        this.gameContext.board.selectedTile = tile;
    }
}