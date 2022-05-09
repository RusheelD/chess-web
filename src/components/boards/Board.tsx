import React from 'react';
import { PieceInfo } from '../../models';
import { Piece } from '../pieces/Piece';
import { Tile } from '../tiles/Tile'
import './Board.css';
import {default as pieces} from "./initial.json";

export interface BoardProps {
}

export function Board(props: BoardProps) {
    var pieceMap = new Map<string, PieceInfo>(Object.entries(pieces));
    /*return(
        <div style={{display: 'inline-block'}}>
            {[...Array(8)].map((x, i) => 
                [...Array(8)].map((y, j) => 
                    <Tile rank={(8-i).toString()} file={String.fromCharCode(j + 97)} children={<Piece color={pieceMap.get(String.fromCharCode(j + 97)+(8-i).toString())!.color} name={pieceMap.get(String.fromCharCode(j + 97)+(8-i).toString())!.name}/>}/>
                )
            )}
        </div>
    );*/
    var rows = [];
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
            tiles.push(<Tile rank={rank} file={file} piece={child ? child.props : null }/>);
        }
        
        rows.push(<div style={{width: 'fit-content'}} className={'row'} children={tiles}></div>);
    }
    var div = React.createElement('div', {display: 'inline-block', className: 'board'}, rows)
    return(div);
}
