import React from 'react';
import { Piece } from '../pieces/Piece';
import { Tile } from '../tiles/Tile'
import './Board.css';

export interface BoardProps {
    children:any;
}

export function Board(props: BoardProps) { 
    var tiles = [];
    for (var i = 97; i < 105; i += 1) {
        for (var j = 1; j < 9; j += 1) {
            var file = String.fromCharCode(i);
            var rank = j.toString();
            tiles.push(<Tile rank={rank} file={file} children={null}/>);
        }
    }
    var span = React.createElement('span', {className: 'board'})
    var div = React.createElement('div', {display: 'inline-block'}, [props.children, span, tiles])
    return(div);
}
