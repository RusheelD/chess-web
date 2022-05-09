import { BoardInfo, PieceInfo, TileInfo, UserContext } from "./core";
import { default as piecePositions } from "../components/boards/initial.json";

function initializeBoard(): BoardInfo {
    var pieceMap = new Map<string, PieceInfo>(Object.entries(piecePositions));
    var tiles: Map<string, TileInfo> = new Map<string, TileInfo>();
    var pieces: PieceInfo[] = [];

    for (let file of [...Array(8)].map((y, k) => String.fromCharCode(k + 97))) {
        for (let rank = 1; rank <= 8; rank++) {
            var tile = file + rank;

            if (pieceMap.has(tile)) {
                const piece: PieceInfo = {
                    ...pieceMap.get(tile)!
                };

                pieces.push(piece);
                tiles.set(tile, {
                    rank: rank.toString(),
                    file,
                    piece,
                    isSelected: false,
                });
            } else {
                tiles.set(tile, {
                    file,
                    rank: rank.toString(),
                    isSelected: false,
                });
            }
        }
    }

    return {
        tiles: tiles,
        pieces: pieces,
        isFlipped: false,
        selectedTile: undefined
    };
}

function initialize(): UserContext {
    const userContext: UserContext = {
        gameContext: {
            game: {
                moves: [],
                firstPlayer: {
                    name: "Russel",
                    colorChosen: "white",
                    isComputer: false
                },
                secondPlayer: {
                    name: "Wilson",
                    colorChosen: "black",
                    isComputer: false
                }
            },
            board: initializeBoard()
        }
    }

    return userContext;
}

export const userContext = initialize();
