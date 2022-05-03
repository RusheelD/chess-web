import { useState } from 'react';
import './Tile.css';

export interface TileProps {
    rank: string;
    file: string;
    children: any;
}

export function Tile(props: TileProps) {
    const [clickStatus, setClickStatus] = useState(false);
    var scale = (parseInt(props.rank)%2 + (props.file.charCodeAt(0) - 96)%2)%2;
    var tileStyle = scale ? 'whiteTile' : 'blackTile';
    return(
    <div style={{display: 'inline-block'}} className={tileStyle} onClick={() => setClickStatus(!clickStatus)}>
        {<span className={'tile ' + props.file + ' _' + props.rank + ' ' + (clickStatus ? "clicked" : "")}>
            {props.children}
        </span>}
    </div>
    );
}
