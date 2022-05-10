import { useEffect, useState } from 'react';
import { TileProps } from '../../models';
import { Piece } from '../pieces/Piece';
import './Tile.css';

export function Tile(props: TileProps) {
    var colorCode = (parseInt(props.rank) % 2 + (props.file.toLowerCase().charCodeAt(0) - 96) % 2) % 2;
    var tileStyle = colorCode ? 'whiteTile' : 'blackTile';
    const [selected, setSelected] = useState(props.isSelected);
    const [piece, setPiece] = useState(props.piece);

    useEffect(() => {
        setSelected(props.isSelected);
    }, [props.isSelected]);

    useEffect(() => {
        setPiece(props.piece);
    }, [props.piece]);
    
    return (
        <div className={"tile " + tileStyle + ' ' + (selected ? "clicked" : "")} onClick={() => props.onSelect()}>
            {<span className={props.file + ' _' + props.rank}>
                {piece ? <Piece {...piece} /> : null}
            </span>}
        </div>
    );
}
