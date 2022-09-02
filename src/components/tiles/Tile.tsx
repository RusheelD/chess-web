import { useEffect, useState } from 'react';
import { TileProps } from '../../models';
import { Piece } from '../pieces/Piece';
import './Tile.css';

export function Tile(props: TileProps) {
    let colorCode = (parseInt(props.rank) % 2 + (props.file.toLowerCase().charCodeAt(0) - 96) % 2) % 2;
    const [selected, setSelected] = useState(props.isSelected);
    const [piece, setPiece] = useState(props.piece);
    const [recentlyMoved, setRecentlyMoved] = useState(props.isRecentlyMoved);
    const [possibleMove, setPossibleMove] = useState(props.isPossibleMove);

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

    let tileClasses = colorCode ? "whiteTile " : "blackTile ";
    tileClasses += selected ? "clicked " : "";

    let spanClasses = props.file + " _" + props.rank + " ";
    spanClasses += recentlyMoved ? "recentlyMoved " : "";
    spanClasses += possibleMove ? "possible " : "";

    return (
        <div className={"tile " + tileClasses} onClick={() => props.onSelect()}>
            {<span className={spanClasses}>
                {piece ? <Piece {...piece} /> : null}
            </span>}
        </div>
    );
}
