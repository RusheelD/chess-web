import { BoardInfo, ChessGame, GameMode, PieceInfo, PlayMode, TileInfo, User, UserContext } from "./core";
import { GameClient } from "../controllers";
import { default as piecePositions } from "./initial.json";

function fromFen(fen: string): Map<string, { color: string, name: string }> {
    const map: Map<string, { color: string, name: string }> = new Map();
    let rows = fen.split('/', 8);
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        for (let j = 0; j < row.length; j++) {
            if(row.charCodeAt(j) <= 56) {
                continue;
            }
            let color = row.charCodeAt(j)<94 ? "white" : "black";
            let name;
            switch (row.charAt(j).toLowerCase()) {
                case 'p' : name = "pawn"; break;
                case 'n' : name = "knight"; break;
                case 'b' : name = "bishop"; break;
                case 'r' : name = "rook"; break;
                case 'q' : name = "queen"; break;
                case 'k' : name = "king"; break;
                default: name = "pawn"; break;
            }
            map.set(String.fromCharCode(104-i)+(j+1), {color: color, name: name});
        }
    }
    return map;
}

function initializeBoard(isFlipped: boolean): BoardInfo {
    let data = {
        fen: ""
    };
    let pieceMap = new Map();
    fetch("/game").then((res) =>
          res.json().then((raw_data) => {
              // Setting a data from api
              data.fen = raw_data.board;
              pieceMap = fromFen(data.fen);
          })
      );
    pieceMap = new Map<string, { color: string, name: string }>(Object.entries(piecePositions));
    
    console.log(pieceMap);
    let tiles: Map<string, TileInfo> = new Map<string, TileInfo>();
    let pieces: PieceInfo[] = [];

    for (let file of [...Array(8)].map((_, k) => String.fromCharCode(k + 97))) {
        for (let rank = 1; rank <= 8; rank++) {
            let tile = file + rank;

            if (pieceMap.has(tile)) {
                const piece: PieceInfo = {
                    ...pieceMap.get(tile)!,
                    moveCount: 0,
                    isDead: false,
                };

                pieces.push(piece);
                tiles.set(tile, {
                    rank: rank.toString(),
                    file,
                    piece,
                    isSelected: false,
                    isRecentlyMoved: false,
                    isPossibleMove: false,
                });
                piece.currentTile = tiles.get(tile);
            } else {
                tiles.set(tile, {
                    file,
                    rank: rank.toString(),
                    isSelected: false,
                    isRecentlyMoved: false,
                    isPossibleMove: false
                });
            }
        }
    }

    return {
        tiles: tiles,
        pieces: pieces,
        isFlipped,
        selectedTile: undefined,
        recentMoves: [],
        possibleMoves: [],
        deadWhite: {
            color: "white",
            pieces: []
        },
        deadBlack: {
            color: "black",
            pieces: []
        }
    };
}

function initialize(): UserContext {
    const currentUser: User = {
        id: "rusheel@gmail.com",
        name: "Rusheel"
    };
    const game = createGame(currentUser);

    // By default the play mode is pass and play
    const newUserContext: UserContext = {
        user: currentUser,
        enableTestMode: false,
        gameContext: {
            playMode: PlayMode.PassAndPlay,
            game,
            board: initializeBoard(currentUser.id === game.firstPlayer.user?.id ? false : true),
            playerToPlay: game.firstPlayer
        },
    }

    newUserContext.gameClient = new GameClient(newUserContext.gameContext!);
    return newUserContext;
}

function createGame(currentUser: User): ChessGame {
    // This function is a proxy to create a new game or
    // load an existing game. Currently we are creating a
    // pass and play classic game with the current user as the first player
    const otherPlayerUser = {
        id: "prakash@gmail.com",
        name: "Prakash",
    };

    return {
        moves: [],  // since this is a new game
        firstPlayer: {
            user: currentUser,
            colorChosen: "white",
            isComputer: false
        },
        secondPlayer: {
            user: otherPlayerUser,
            colorChosen: "black",
            isComputer: false
        },
        mode: GameMode.Classic
    };
}

export const userContext = initialize();
