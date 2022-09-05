import { PromotionInfo, TileInfo, TileProps } from "../../models";
import { Tile } from "../tiles/Tile";

export function Promotion(props: PromotionInfo) {
  let rank = props.color === "white" ? "9" : "10";
  let base: TileInfo = {
    rank: rank,
    file: "i",
    isSelected: false,
    isRecentlyMoved: false,
    isPossibleMove: false,
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isPromotion: true,
    isTransparent: false,
  };
  let transparent: TileProps = {
    ...base,
    isTransparent: true,
    onSelect: () => null,
  };
  let queen: TileProps = {
    ...base,
    piece: {
      name: "queen",
      color: props.color,
      isDead: false,
      moveCount: 0,
    },
    onSelect: () => props.onSelectPromotion(base),
  };
  let rook: TileProps = {
    ...base,
    piece: {
      name: "rook",
      color: props.color,
      isDead: false,
      moveCount: 0,
    },
    onSelect: () => props.onSelectPromotion(base),
  };
  let bishop: TileProps = {
    ...base,
    piece: {
      name: "bishop",
      color: props.color,
      isDead: false,
      moveCount: 0,
    },
    onSelect: () => props.onSelectPromotion(base),
  };
  let knight: TileProps = {
    ...base,
    piece: {
      name: "knight",
      color: props.color,
      isDead: false,
      moveCount: 0,
    },
    onSelect: () => props.onSelectPromotion(base),
  };
  return (
    <div>
      <div>
        <Tile {...transparent} />
        <Tile {...queen} />
        <Tile {...transparent} />
      </div>
      <div>
        <Tile {...bishop} />
        <Tile {...transparent}></Tile>
        <Tile {...knight} />
      </div>
      <div>
        <Tile {...transparent} />
        <Tile {...rook} />
        <Tile {...transparent} />
      </div>
    </div>
  );
}
