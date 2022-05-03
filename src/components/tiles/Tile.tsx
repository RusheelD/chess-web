import './Tile.css';

export interface TileProps {
    rank: string;
    file: string;
    children: any;
}

export function Tile(props: TileProps) { 
    var scale = (parseInt(props.rank)%2 + (props.file.charCodeAt(0) - 96)%2)%2;
    var color = 180 * scale + 75;
    return(
    <div style={{display: 'inline-block'}}>
        {<span className={'tile ' + props.file + props.rank} style={{background: 'rgb(' + color + ', ' + color + ', ' + color + ')'}}>
            {props.children}
        </span>}
    </div>
);
}
