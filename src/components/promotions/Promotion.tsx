import { useEffect, useState } from "react";
import { PromotionProps, TileInfo, TileProps } from "../../models";
import { Tile } from "../tiles/Tile";
import "./Promotion.css";

export function Promotion(props: PromotionProps) {
  let [location, setLocation] = useState(props.location);
  useEffect(() => {
    setLocation(props.location);
    if (props.location === "" && props.color === "") {
      setLocation("q9");
    }
  }, [props.location, props.color]);

  let promoClasses = "promo " + location.charAt(0) + " _" + location.charAt(1);
  let rank = (parseInt(location.charAt(1)) + 1).toString();
  let base: TileInfo = {
    rank: rank,
    file: location.charAt(0),
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
    onSelect: () => props.onSelectPromotion(queen),
  };
  let rook: TileProps = {
    ...base,
    piece: {
      name: "rook",
      color: props.color,
      isDead: false,
      moveCount: 0,
    },
    onSelect: () => props.onSelectPromotion(rook),
  };
  let bishop: TileProps = {
    ...base,
    piece: {
      name: "bishop",
      color: props.color,
      isDead: false,
      moveCount: 0,
    },
    onSelect: () => props.onSelectPromotion(bishop),
  };
  let knight: TileProps = {
    ...base,
    piece: {
      name: "knight",
      color: props.color,
      isDead: false,
      moveCount: 0,
    },
    onSelect: () => props.onSelectPromotion(knight),
  };

  return (
    <div className={promoClasses}>
      <div className={"above"}>
        <Tile {...transparent} />
        <Tile {...queen} />
        <Tile {...transparent} />
      </div>
      <div className={"at"}>
        <Tile {...bishop} />
        <div className={"center"}>
          <Tile {...transparent}></Tile>
        </div>
        <Tile {...knight} />
      </div>
      <div className={"below"}>
        <Tile {...transparent} />
        <Tile {...rook} />
        <Tile {...transparent} />
      </div>
    </div>
  );
}
