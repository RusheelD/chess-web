import {
  BoardInfo,
  ChessGame,
  GameMode,
  PieceInfo,
  PlayMode,
  TileInfo,
  User,
  UserContext,
} from "./core";
import { GameClient } from "../controllers";

export function fromFen(
  game: ChessGame,
  fen: string,
  moveFen: string | undefined
): Map<string, PieceInfo> {
  const map: Map<string, PieceInfo> = new Map();
  let rows = fen.split("/", 8);
  let moveRows = moveFen ? moveFen.split("/", 8) : undefined;
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    let moveRow = moveRows ? moveRows[i] : undefined;
    let offset = 0;
    for (let j = 0; j < row.length; j++) {
      if (row.charCodeAt(j) <= 56) {
        offset += parseInt(row.charAt(j)) - 1;
        continue;
      }
      let color = row.charCodeAt(j) < 94 ? "white" : "black";
      let name;
      switch (row.charAt(j).toLowerCase()) {
        case "p":
          name = "pawn";
          break;
        case "n":
          name = "knight";
          break;
        case "b":
          name = "bishop";
          break;
        case "r":
          name = "rook";
          break;
        case "q":
          name = "queen";
          break;
        case "k":
          name = "king";
          break;
        default:
          name = "pawn";
          break;
      }
      let moveCount = moveRow
        ? parseInt(moveRow.split(",")[j + offset])
        : undefined;
      if (moveCount && moveCount > 0) {
        game.isStarted = true;
      }
      map.set(String.fromCharCode(97 + j + offset) + (8 - i), {
        color: color,
        name: name,
        moveCount: moveCount ? moveCount : 0,
        isDead: false,
      });
    }
  }
  return map;
}

export function getDead(dead: string): PieceInfo[] {
  let pieces: PieceInfo[] = [];
  for (let i = 0; i < dead.length; i++) {
    let color = dead.charCodeAt(i) < 94 ? "white" : "black";
    let name;
    switch (dead.charAt(i).toLowerCase()) {
      case "p":
        name = "pawn";
        break;
      case "n":
        name = "knight";
        break;
      case "b":
        name = "bishop";
        break;
      case "r":
        name = "rook";
        break;
      case "q":
        name = "queen";
        break;
      case "k":
        name = "king";
        break;
      default:
        name = "pawn";
        break;
    }

    pieces.push({
      color: color,
      name: name,
      isDead: true,
      moveCount: 0,
    });
  }
  return pieces;
}

export function loadLocations(board: BoardInfo, locations: string): TileInfo[] {
  let tiles: TileInfo[] = [];
  if (locations === "") return tiles;
  for (let location of locations.split(",")) {
    if (board.tiles.has(location)) {
      tiles.push(board.tiles.get(location)!);
    }
  }
  return tiles;
}

export function loadBoard(
  fen: string,
  moveFen: string,
  board: BoardInfo,
  game: ChessGame
): void {
  let pieceMap = fromFen(game, fen, moveFen);

  for (let file of [...Array(8)].map((_, k) => String.fromCharCode(k + 97))) {
    for (let rank = 1; rank <= 8; rank++) {
      let tile = file + rank;

      if (pieceMap.has(tile)) {
        const piece: PieceInfo = {
          ...pieceMap.get(tile)!,
        };
        board.tiles.get(tile)!.piece = piece;
        piece.currentTile = board.tiles.get(tile);
        board.pieces.push(piece);
      } else {
        board.tiles.get(tile)!.piece = undefined;
      }
    }
  }
}

function initializeBoard(isFlipped: boolean): BoardInfo {
  let tiles: Map<string, TileInfo> = new Map<string, TileInfo>();
  let pieces: PieceInfo[] = [];

  for (let file of [...Array(8)].map((_, k) => String.fromCharCode(k + 97))) {
    for (let rank = 1; rank <= 8; rank++) {
      let tile = file + rank;
      tiles.set(tile, {
        file,
        rank: rank.toString(),
        isSelected: false,
        isRecentlyMoved: false,
        isPossibleMove: false,
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isPromotion: false,
        isTransparent: false,
      });
    }
  }

  return {
    tiles: tiles,
    pieces: pieces,
    selectedTile: undefined,
    recentMoves: [],
    possibleMoves: [],
    deadWhite: {
      color: "white",
      pieces: [],
    },
    deadBlack: {
      color: "black",
      pieces: [],
    },
    promotion: {
      color: "",
      location: "",
    },
  };
}

function initialize(): UserContext {
  const currentUser: User = {
    id: "rusheel@gmail.com",
    name: "Rusheel",
    code: "",
    isLogged: false,
  };
  const game = createGame(currentUser);

  // By default the play mode is pass and play
  const newUserContext: UserContext = {
    user: currentUser,
    enableTestMode: false,
    gameContext: {
      playMode: PlayMode.PassAndPlay,
      game,
      board: initializeBoard(
        currentUser.id === game.firstPlayer.user?.id ? false : true
      ),
      playerToPlay: game.firstPlayer,
    },
  };

  newUserContext.gameClient = new GameClient(
    newUserContext.gameContext!,
    newUserContext
  );
  return newUserContext;
}

function createGame(currentUser: User): ChessGame {
  // This function is a proxy to create a new game or
  // load an existing game. Currently we are creating a
  // pass and play classic game with the current user as the first player
  const otherPlayerUser = {
    id: "prakash@gmail.com",
    name: "Prakash",
    code: "",
    isLogged: false,
  };

  return {
    moves: [], // since this is a new game
    firstPlayer: {
      user: currentUser,
      colorChosen: "white",
      isComputer: false,
    },
    secondPlayer: {
      user: otherPlayerUser,
      colorChosen: "black",
      isComputer: false,
    },
    mode: GameMode.Classic,
    isOver: false,
    isStarted: false,
  };
}

export const userContext = initialize();
