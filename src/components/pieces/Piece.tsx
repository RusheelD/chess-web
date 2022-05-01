import './Piece.css';

export interface PieceProps {
    color: string;
    name: string;
}

export const Piece = (props: PieceProps) => (
    <div style={{display: 'inline-block'}}>
        <span className={'piece ' + props.color + ' ' + props.name} />
    </div>
);
