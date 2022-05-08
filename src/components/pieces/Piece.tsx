import './Piece.css';

export interface PieceProps {
    color: string;
    name: string;
}

export const Piece = (props: PieceProps) => (
    <span className={'piece ' + props.color + ' ' + props.name} />
);
