import { DeadInfo } from '../../models';
import { Piece } from '../pieces/Piece'
import './DeadPieces.css'

export function DeadPieces(props: DeadInfo) {
    return (
        <div className={"dead " + props.color}>
            {
                [...Array(props.pieces.length)].map((_, pieceIndex) => {
                    const piece = props.pieces[pieceIndex];
                    return (
                        <Piece {...piece}></Piece>
                    );
                })
            }
        </div>
    )
}