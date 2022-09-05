import { useEffect, useState } from "react";
import { BoardProps } from "../../models";
import { Tile } from "../tiles/Tile";
import "./Board.css";

export function Board(props: BoardProps) {
  const [tiles, setTiles] = useState(props.tiles);

  useEffect(() => {
    setTiles(props.tiles);
  }, [
    props.tiles,
    props.selectedTile,
    props.gameClient,
    props.resetKey,
    props.promotion,
  ]);

  const factor =
    props.gameClient!.gameContext.playerToPlay ===
    props.gameClient!.gameContext.game.firstPlayer
      ? 0
      : 1;

  return (
    <div className="board">
      {[...Array(8)].map((_, row) => {
        const rank = (Math.abs(7 * Math.abs(factor - 1) - row) + 1).toString();
        return (
          <div key={"__game_row_" + rank} className="row">
            {[...Array(8)].map((__, col) => {
              const file = String.fromCharCode(
                Math.abs(7 * Math.abs(factor) - col) + 97
              );
              const tileInfo = tiles.get(file + rank)!;

              return (
                <Tile
                  key={"__game_cell_" + file + rank}
                  {...tileInfo}
                  onSelect={() => props.onSelectTile(tileInfo)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
