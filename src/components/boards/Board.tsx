import { useEffect, useState } from "react";
import { BoardProps } from "../../models";
import { Tile } from "../tiles/Tile";
import "./Board.css";

export function Board(props: BoardProps) {
  const [tiles, setTiles] = useState(props.tiles);
  const [overlay, setOverlay] = useState(
    props.inPromotion ? "promotionScreen" : "invisible"
  );

  useEffect(() => {
    setTiles(props.tiles);
  }, [
    props.tiles,
    props.selectedTile,
    props.gameClient,
    props.resetKey,
    props.promotion,
  ]);

  useEffect(() => {
    if (props.inPromotion) {
      setOverlay("promotionScreen");
    } else {
      setOverlay("invisible");
    }
  }, [props.inPromotion]);

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
              let colorCode =
                ((parseInt(tileInfo.rank) % 2) +
                  ((tileInfo.file.toLowerCase().charCodeAt(0) - 96) % 2)) %
                2;

              return (
                <div className="cell">
                  <Tile
                    key={"__game_cell_" + file + rank}
                    {...tileInfo}
                    onSelect={() => props.onSelectTile(tileInfo)}
                  />
                  <div
                    className={"texture " + (colorCode ? "light" : "dark")}
                  />
                  <div
                    className={
                      props.inPromotion
                        ? file + rank !==
                          props.inPromotion?.file + props.inPromotion?.rank
                          ? overlay
                          : "invisible"
                        : "invisible"
                    }
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
