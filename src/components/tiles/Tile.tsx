import './Tile.css';

export interface TileProps {
    rank: string;
    file: string;
    children: any;
}

export function Tile(props: TileProps) { 
    var scale = (parseInt(props.rank)%2 + (props.file.charCodeAt(0) - 96)%2)%2;
    var tileStyle = scale ? 'whiteTile' : 'blackTile';
    return(
    <div style={{display: 'inline-block'}}>
        {<span className={'tile ' + props.file + ' _' + props.rank + ' ' + tileStyle}>
            {props.children}
        </span>}
    </div>
);
}
