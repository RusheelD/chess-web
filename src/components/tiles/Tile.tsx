import { useState } from 'react';
import { TileInfo } from '../../models';
import { Piece } from '../pieces/Piece';
import './Tile.css';

export function Tile(props: TileInfo) {
    const [clickStatus, setClickStatus] = useState(false);
    var colorCode = (parseInt(props.rank) % 2 + (props.file.toLowerCase().charCodeAt(0) - 96) % 2) % 2;
    var tileStyle = colorCode ? 'whiteTile' : 'blackTile';
    return(
        <div className={"tile " + tileStyle + ' ' + (clickStatus ? "clicked" : "")} onClick={() => setClickStatus(!clickStatus)}>
            {<span className={props.file + ' _' + props.rank}>
                {props.piece ? <Piece {...props.piece} /> : null}
            </span>}
        </div>
    );
}
