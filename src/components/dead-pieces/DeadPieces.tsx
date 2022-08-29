import { DeadInfo } from '../../models';
import { Piece } from '../pieces/Piece'
import './DeadPieces.css'

export function DeadPieces(props: DeadInfo) {
    let empty = " "
    if(props.pieces.length === 0) {
        empty = " empty"
    }
    return (
        <div className={"dead " + props.color + empty}>
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