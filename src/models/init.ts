import { BoardInfo, ChessGame, GameMode, PieceInfo, PlayMode, TileInfo, User, UserContext } from "./core";
import { GameClient } from "../controllers";
import { default as piecePositions } from "./initial.json";

function initializeBoard(isFlipped: boolean): BoardInfo {
    var pieceMap = new Map<string, PieceInfo>(Object.entries(piecePositions));
    var tiles: Map<string, TileInfo> = new Map<string, TileInfo>();
    var pieces: PieceInfo[] = [];

    for (let file of [...Array(8)].map((_, k) => String.fromCharCode(k + 97))) {
        for (let rank = 1; rank <= 8; rank++) {
            var tile = file + rank;

            if (pieceMap.has(tile)) {
                const piece: PieceInfo = {
                    ...pieceMap.get(tile)!,
                    moveCount: 0
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
        possibleMoves: []
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
