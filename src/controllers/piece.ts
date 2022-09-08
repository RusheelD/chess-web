import { BoardInfo, ChessGame, TileInfo } from "../models";

const bounds = {
  left: "a".charCodeAt(0),
  right: "h".charCodeAt(0),
  top: 8,
  bottom: 1,
};

function toRowCol(tile: TileInfo): [number, number] {
  let row = parseInt(tile.rank);
  let col = tile.file.charCodeAt(0);

  return [row, col];
}

function isInBounds(move: number[]): boolean {
  let [row, col] = move;
  if (
    row > bounds.top ||
    row < bounds.bottom ||
    col > bounds.right ||
    col < bounds.left
  ) {
    return false;
  }

  return true;
}

function getTile(board: BoardInfo, move: number[]): TileInfo {
  let [row, col] = move;
  return board.tiles.get(String.fromCharCode(col) + row)!;
}

function removeInvalidMoves(
  game: ChessGame,
  board: BoardInfo,
  moves: TileInfo[],
  tile: TileInfo
): TileInfo[] {
  let validMoves: TileInfo[] = [];
  let tempBoard = { ...board };

  for (let move of moves) {
    let tempTile = getTile(tempBoard, toRowCol(move)).piece;
    getTile(tempBoard, toRowCol(move)).piece = getTile(
      tempBoard,
      toRowCol(tile)
    ).piece;
    getTile(tempBoard, toRowCol(tile)).piece = undefined;
    if (!kingInCheck(game, tempBoard, move.piece!.color)) {
      validMoves.push(move);
    }

    getTile(tempBoard, toRowCol(tile)).piece = getTile(
      tempBoard,
      toRowCol(move)
    ).piece;
    getTile(tempBoard, toRowCol(move)).piece = tempTile;
  }

  return validMoves;
}

function getAllAttackMoves(
  game: ChessGame,
  board: BoardInfo,
  color: string
): TileInfo[] {
  let attackMoves: TileInfo[] = [];

  for (let tile of Array.from(board.tiles.values())) {
    if (tile.piece && tile.piece.color === color) {
      pieceControllers
        .get(tile.piece.name)
        ?.computeAttackMoves(game, board, tile)
        .forEach((tile) => attackMoves.push(tile));
    }
  }

  return attackMoves;
}

export function getAllValidMoves(
  game: ChessGame,
  board: BoardInfo,
  color: string
): TileInfo[] {
  let validMoves: TileInfo[] = [];

  for (let tile of Array.from(board.tiles.values())) {
    if (tile.piece && tile.piece.color === color) {
      pieceControllers
        .get(tile.piece.name)
        ?.computeValidMoves(game, board, tile)
        .forEach((tile) => validMoves.push(tile));
    }
  }

  return validMoves;
}

export function kingInCheck(
  game: ChessGame,
  board: BoardInfo,
  color: string
): TileInfo | undefined {
  let attackMoves = getAllAttackMoves(
    game,
    board,
    color === "white" ? "black" : "white"
  );

  for (let attackMove of attackMoves) {
    if (
      attackMove.piece?.name === "king" &&
      attackMove.piece?.color === color
    ) {
      return attackMove;
    }
  }

  return undefined;
}

export function kingsInCheck(game: ChessGame, board: BoardInfo): void {
  let white = kingInCheck(game, board, "white");
  let black = kingInCheck(game, board, "black");
  if (white) {
    white.isCheck = true;
    board.inCheck = white;
  } else if (black) {
    black.isCheck = true;
    board.inCheck = black;
  } else {
    board.inCheck = undefined;
  }
}

export function stalemate(game: ChessGame, board: BoardInfo): void {
  let kings: TileInfo[] = [];
  if (
    getAllValidMoves(game, board, "white").length === 0 ||
    getAllValidMoves(game, board, "black").length === 0
  ) {
    if (board.inCheck) {
      return;
    }
    for (let tile of Array.from(board.tiles.values())) {
      if (tile.piece?.name === "king") {
        kings.push(tile);
      }
    }
    board.inStalemate = kings;
  }
}

export function checkEnpassantKillAndGetDeadTile(
  game: ChessGame,
  board: BoardInfo,
  fromTile: TileInfo,
  targetTile: TileInfo
): TileInfo | undefined {
  let multiplier = fromTile.piece?.color === "white" ? 1 : -1;
  let move = toRowCol(targetTile);
  if (fromTile.piece?.name === "pawn" && game.moves.length > 0) {
    let enpTile = getTile(board, [move[0] - 1 * multiplier, move[1]]);
    let lastMove = game.moves[game.moves.length - 1];
    let from = board.tiles.get(game.moves[game.moves.length - 1].from);
    let to = board.tiles.get(game.moves[game.moves.length - 1].to);

    if (
      enpTile.piece &&
      enpTile.piece === lastMove.piece && // If the last move is the same as the enp piece
      from &&
      to &&
      Math.abs(toRowCol(from)[0] - toRowCol(to)[0]) === 2 &&
      enpTile.piece.name === "pawn"
    ) {
      // And it moved two pieces

      return enpTile;
    }
  }

  return undefined;
}

export function checkCastleAndGetRook(
  board: BoardInfo,
  fromTile: TileInfo,
  targetTile: TileInfo
): TileInfo[] | undefined {
  let to = toRowCol(targetTile);
  let from = toRowCol(fromTile);

  if (targetTile.piece?.name === "king" && Math.abs(to[1] - from[1]) === 2) {
    let factor = Math.sign(to[1] - from[1]) === 1 ? 1 : 2;
    return [
      getTile(board, [to[0], to[1] + Math.sign(to[1] - from[1]) * factor]),
      getTile(board, [to[0], to[1] - Math.sign(to[1] - from[1])]),
    ];
  }

  return undefined;
}

interface PiecePower {
  speed: number;
  value: number;
}

const allPiecePowers = new Map<string, PiecePower>([
  ["king", { speed: 5, value: 0 }],
  ["queen", { speed: 4, value: 9 }],
  ["rook", { speed: 3, value: 5 }],
  ["knight", { speed: 2, value: 3 }],
  ["bishop", { speed: 2, value: 3 }],
  ["pawn", { speed: 1, value: 1 }],
]);

export interface IPieceController {
  computeValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[];
  computeAttackMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[];
}

export class KnightController implements IPieceController {
  computeAttackMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let [row, col] = toRowCol(currentTile);

    let possibleTiles = [
      [row + 2, col + 1],
      [row + 1, col + 2],
      [row - 2, col - 1],
      [row - 1, col - 2],
      [row + 2, col - 1],
      [row + 1, col - 2],
      [row - 2, col + 1],
      [row - 1, col + 2],
    ];
    let validMoves: TileInfo[] = [];
    for (let move of possibleTiles) {
      if (isInBounds(move)) {
        let tile = getTile(board, move);
        if (!tile.piece || tile.piece?.color !== currentTile.piece?.color) {
          validMoves.push(tile);
        }
      }
    }

    return validMoves;
  }

  computeValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let moves: TileInfo[] = this.computeAttackMoves(game, board, currentTile);
    return removeInvalidMoves(game, board, moves, currentTile);
  }
}

export class PawnController implements IPieceController {
  computeAttackMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let [row, col] = toRowCol(currentTile);
    let validMoves: TileInfo[] = [];
    let multiplier = currentTile.piece!.color === "white" ? 1 : -1;

    // Pawn attacks including enpassant
    for (let move of [
      [row + 1 * multiplier, col + 1],
      [row + 1 * multiplier, col - 1],
    ]) {
      if (isInBounds(move)) {
        let targetTile = getTile(board, move);
        if (targetTile.piece) {
          validMoves.push(targetTile);
        }
      }
    }

    return validMoves;
  }

  computeAllValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let [row, col] = toRowCol(currentTile);
    let validMoves: TileInfo[] = [];
    let multiplier = currentTile.piece!.color === "white" ? 1 : -1;

    // Linear movement
    let tile = getTile(board, [row + 1 * multiplier, col]);
    if (!tile.piece) {
      validMoves.push(tile);

      // If pawn is at its baseline
      if (row * multiplier === 2 || row * multiplier === -7) {
        let secondTile = getTile(board, [row + 2 * multiplier, col]);
        if (!secondTile.piece) {
          validMoves.push(secondTile);
        }
      }
    }

    // Pawn attacks including enpassant
    for (let move of [
      [row + 1 * multiplier, col + 1],
      [row + 1 * multiplier, col - 1],
    ]) {
      if (isInBounds(move)) {
        let targetTile = getTile(board, move);
        if (targetTile.piece) {
          if (targetTile.piece.color !== currentTile.piece?.color) {
            validMoves.push(targetTile);
          }
        } else if (
          checkEnpassantKillAndGetDeadTile(game, board, currentTile, targetTile)
        ) {
          // And it moved two pieces
          validMoves.push(targetTile);
        }
      }
    }

    return validMoves;
  }

  computeValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let moves: TileInfo[] = this.computeAllValidMoves(game, board, currentTile);
    return removeInvalidMoves(game, board, moves, currentTile);
  }
}

export class RookController implements IPieceController {
  computeAttackMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let [row, col] = toRowCol(currentTile);
    let validMoves: TileInfo[] = [];

    for (let offsets of [
      [1, 0],
      [-1, 0],
      [0, -1],
      [0, 1],
    ]) {
      let move = [row, col];
      while (isInBounds(move)) {
        move = [move[0] + offsets[0], move[1] + offsets[1]];
        let tile = getTile(board, move);

        if (!tile) {
          break;
        }

        if (tile.piece) {
          if (tile.piece.color !== currentTile.piece?.color) {
            validMoves.push(tile);
          }
          break;
        }
        validMoves.push(tile);
      }
    }

    return validMoves;
  }

  computeValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let moves: TileInfo[] = this.computeAttackMoves(game, board, currentTile);
    return removeInvalidMoves(game, board, moves, currentTile);
  }
}

export class BishopController implements IPieceController {
  computeAttackMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let [row, col] = toRowCol(currentTile);
    let validMoves: TileInfo[] = [];

    for (let offsets of [
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      let move = [row, col];
      while (isInBounds(move)) {
        move = [move[0] + offsets[0], move[1] + offsets[1]];
        let tile = getTile(board, move);

        if (!tile) {
          break;
        }

        if (tile.piece) {
          if (tile.piece.color !== currentTile.piece?.color) {
            validMoves.push(tile);
          }
          break;
        }
        validMoves.push(tile);
      }
    }

    return validMoves;
  }

  computeValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let moves: TileInfo[] = this.computeAttackMoves(game, board, currentTile);
    return removeInvalidMoves(game, board, moves, currentTile);
  }
}

export class QueenController implements IPieceController {
  computeAttackMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    return [
      ...pieceControllers
        .get("rook")!
        .computeAttackMoves(game, board, currentTile),
      ...pieceControllers
        .get("bishop")!
        .computeAttackMoves(game, board, currentTile),
    ];
  }

  computeValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let moves: TileInfo[] = this.computeAttackMoves(game, board, currentTile);
    return removeInvalidMoves(game, board, moves, currentTile);
  }
}

export class KingController implements IPieceController {
  computeAttackMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let move = toRowCol(currentTile);
    let validMoves: TileInfo[] = [];

    // One step move around the current tile
    for (let i of [-1, 0, 1]) {
      for (let j of [-1, 0, 1]) {
        if (i === 0 && j === 0) {
          continue;
        }

        let tempMove = [move[0] + i, move[1] + j];
        if (!isInBounds(tempMove)) {
          continue;
        }

        let tile = getTile(board, [move[0] + i, move[1] + j]);
        if (!tile.piece || tile.piece.color !== currentTile.piece?.color) {
          validMoves.push(tile);
        }
      }
    }

    if (currentTile.piece?.moveCount === 0 && currentTile.file === "e") {
      if (
        !getTile(board, [move[0], move[1] + 1]).piece &&
        !getTile(board, [move[0], move[1] + 2]).piece &&
        getTile(board, [move[0], move[1] + 3]).piece?.name === "rook" &&
        getTile(board, [move[0], move[1] + 3]).piece?.moveCount === 0
      ) {
        validMoves.push(getTile(board, [move[0], move[1] + 2]));
      }
      if (
        !getTile(board, [move[0], move[1] - 1]).piece &&
        !getTile(board, [move[0], move[1] - 2]).piece &&
        !getTile(board, [move[0], move[1] - 3]).piece &&
        getTile(board, [move[0], move[1] - 4]).piece?.name === "rook" &&
        getTile(board, [move[0], move[1] - 4]).piece?.moveCount === 0
      ) {
        validMoves.push(getTile(board, [move[0], move[1] - 2]));
      }
    }

    return validMoves;
  }

  computeValidMoves(
    game: ChessGame,
    board: BoardInfo,
    currentTile: TileInfo
  ): TileInfo[] {
    let moves: TileInfo[] = this.computeAttackMoves(game, board, currentTile);
    return removeInvalidMoves(game, board, moves, currentTile);
  }
}

export const pieceControllers = new Map<string, IPieceController>([
  ["knight", new KnightController()],
  ["pawn", new PawnController()],
  ["rook", new RookController()],
  ["bishop", new BishopController()],
  ["queen", new QueenController()],
  ["king", new KingController()],
]);
