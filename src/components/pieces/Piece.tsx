import { PieceInfo } from '../../models';
import './Piece.css';

export const Piece = (props: PieceInfo) => (
    <span className={'piece ' + props.color + ' ' + props.name} />
);
