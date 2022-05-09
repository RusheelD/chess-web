import React from 'react';
import { BoardInfo, PieceInfo, TileInfo } from '../../models';
import { Piece } from '../pieces/Piece';
import { Tile } from '../tiles/Tile'
import './Board.css';
import {default as pieces} from "./initial.json";

export function Board(props: BoardInfo) {
    const factor = props.isFlipped ? 1 : 0;
    return (
        <div className="board">
            {
                [...Array(8)].map((_, col) => {
                    const rank = (Math.abs(7 * Math.abs(factor - 1) - col) + 1).toString();
                    return (
                        <div key={col} className="row">
                            {
                                [...Array(8)].map((__, row) => {
                                    const file = String.fromCharCode(Math.abs(7 * Math.abs(factor) - row) + 97)

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
