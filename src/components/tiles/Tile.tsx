import { useEffect, useState } from "react";
import { TileProps } from "../../models";
import { Piece } from "../pieces/Piece";
import "./Tile.css";

export function Tile(props: TileProps) {
  let colorCode =
    ((parseInt(props.rank) % 2) +
      ((props.file.toLowerCase().charCodeAt(0) - 96) % 2)) %
    2;
  const [selected, setSelected] = useState(props.isSelected);
  const [piece, setPiece] = useState(props.piece);
  const [recentlyMoved, setRecentlyMoved] = useState(props.isRecentlyMoved);
  const [possibleMove, setPossibleMove] = useState(props.isPossibleMove);
  const [inCheck, setInCheck] = useState(props.isCheck);
  const [checkmate, setCheckmate] = useState(props.isCheckmate);
  const [stalemate, setStalemate] = useState(props.isStalemate);

  useEffect(() => {
    setSelected(props.isSelected);
  }, [props.isSelected]);

  useEffect(() => {
    setPiece(props.piece);
  }, [props.piece]);

  useEffect(() => {
    setRecentlyMoved(props.isRecentlyMoved);
  }, [props.isRecentlyMoved]);

  useEffect(() => {
    setPossibleMove(props.isPossibleMove);
  }, [props.isPossibleMove]);

  useEffect(() => {
    setInCheck(props.isCheck);
  }, [props.isCheck]);

  useEffect(() => {
    setCheckmate(props.isCheckmate);
  }, [props.isCheckmate]);

  useEffect(() => {
    setStalemate(props.isStalemate);
  }, [props.isStalemate]);

  let tileClasses = colorCode ? "whiteTile " : "blackTile ";
  tileClasses += selected ? "clicked " : "";

  let spanClasses = props.file + " _" + props.rank + " ";
  spanClasses += recentlyMoved ? "recentlyMoved " : "";
  spanClasses += possibleMove ? "possible " : "";
  spanClasses += inCheck ? "check " : "";
  spanClasses += checkmate ? "checkmate " : "";
  spanClasses += stalemate ? "stalemate" : "";

  return (
    <div className={"tile " + tileClasses} onClick={() => props.onSelect()}>
      {
        <span className={spanClasses}>
          {piece ? <Piece {...piece} /> : null}
        </span>
      }
    </div>
  );
}
