import { isValidInputTimeValue } from '@testing-library/user-event/dist/utils';
import React from 'react';
import { Piece, PieceProps } from '../pieces/Piece';
import { Tile } from '../tiles/Tile'
import './Board.css';
import {default as pieces} from "./initial.json";

export interface BoardProps {
    children:any;
}

export function Board(props: BoardProps) {
    var rows = [];
    var pieceMap = new Map<string, PieceProps>();
    for (var k in Object.keys(pieces)) {
        pieceMap.set(Object.keys(pieces)[k], Object.values(pieces)[k]);
    }
    for (var j = 8; j > 0; j -= 1) {
        var tiles = [];
        for (var i = 97; i < 105; i += 1) {
            var file = String.fromCharCode(i);
            var rank = j.toString();
            var tile = file+rank;
            var child = null;
            if(pieceMap.has(tile)) {
                child = <Piece color={pieceMap.get(tile)!.color} name={pieceMap.get(tile)!.name}/>
            }
            tiles.push(<Tile rank={rank} file={file} children={child}/>);
        }
        rows.push(<div style={{display:'inline-block'}} className={'row'} children={tiles}></div>);
    }
    // var span = React.createElement('span', {className: 'board'})
    var div = React.createElement('div', {display: 'inline-block'}, [props.children, rows])
    return(div);
}
