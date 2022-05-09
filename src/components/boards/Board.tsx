import React from 'react';
import { BoardInfo, PieceInfo, TileInfo } from '../../models';
import { Piece } from '../pieces/Piece';
import { Tile } from '../tiles/Tile'
import './Board.css';
import {default as pieces} from "./initial.json";

export function Board(props: BoardInfo) {
    const factor = props.isFlipped ? 0 : 1;
    return (
        <div className="board">
            {
                [...Array(8)].map((x, col) => {
                    const rank = (Math.abs(7 * Math.abs(factor) - col) + 1).toString();
                    return (
                        <div key={col} className="row">
                            {
                                [...Array(8)].map((y, row) => {
                                    const file = String.fromCharCode(Math.abs(7 * Math.abs(factor - 1) - row) + 97)

                                    return (
                                        <Tile key={row} {...props.tiles.get(file + rank)!} />
                                    );
                                })
                            }
                        </div>
                    );
                })
            }
        </div>
    );
}
