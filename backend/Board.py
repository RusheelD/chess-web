import os

import pyglet
from Pieces import *


class Board(object):

    def __init__(self):

        self.current_turn = 1
        self.moves_made = []
        self.dead_white: list[Piece] = []
        self.dead_black: list[Piece] = []
        self.recent_move = []
        self.pieces: list[Piece] = [
            Rook(0, 0, 0, self), Knight(0, 1, 0, self),
            Bishop(0, 2, 0, self), Queen(0, 3, 0, self),
            King(0, 4, 0, self), Bishop(0, 5, 0, self),
            Knight(0, 6, 0, self), Rook(0, 7, 0, self),
            Pawn(1, 0, 0, self), Pawn(1, 1, 0, self),
            Pawn(1, 2, 0, self), Pawn(1, 3, 0, self),
            Pawn(1, 4, 0, self), Pawn(1, 5, 0, self),
            Pawn(1, 6, 0, self), Pawn(1, 7, 0, self),
            Pawn(6, 0, 1, self), Pawn(6, 1, 1, self),
            Pawn(6, 2, 1, self), Pawn(6, 3, 1, self),
            Pawn(6, 4, 1, self), Pawn(6, 5, 1, self),
            Pawn(6, 6, 1, self), Pawn(6, 7, 1, self),
            Rook(7, 0, 1, self), Knight(7, 1, 1, self),
            Bishop(7, 2, 1, self), Queen(7, 3, 1, self),
            King(7, 4, 1, self), Bishop(7, 5, 1, self),
            Knight(7, 6, 1, self), Rook(7, 7, 1, self)
        ]
        self.grid: list[list[Piece | None]] = [
            [None, None, None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None]
        ]
        self.White_King_Pos = [0, 4]
        self.Black_King_Pos = [7, 4]
        self.black_pieces: list[Piece] = []
        self.white_pieces: list[Piece] = []
        self.refresh_pieces()

    def __str__(self):
        string = ""
        for i in range(7, -1, -1):
            count = 0
            for piece in self.grid[i]:
                char = ''
                if piece is None:
                    count += 1
                    continue
                if (count > 0):
                    string += str(count)
                    count = 0
                if (type(piece) == Knight):
                    char += 'n'
                else:
                    char += str(type(piece)).split('.')[1][0]
                if (piece.color == 0):
                    char = char.upper()
                else:
                    char = char.lower()
                string += char
            if (count > 0):
                string += str(count)
            string += "/"
        return string[:-1]

    def move_count_fen(self):
        string = ""
        for i in range(7, -1, -1):
            for piece in self.grid[i]:
                if piece is None:
                    string += "-,"
                    continue
                string += str(piece.steps_taken)+','
            string = string[:-1]+'/'
        return string[:-1]

    def refresh_pieces(self, move=False):
        if not (move):
            self.recent_move.clear()
        for row in self.grid:
            for piece in row:
                piece = None
        self.black_pieces.clear()
        self.white_pieces.clear()
        for piece in self.pieces:
            self.grid[piece.row][piece.column] = piece
            if (piece.color == 1):
                self.black_pieces.append(piece)
            else:
                self.white_pieces.append(piece)

    def copy(self, board):
        self.grid = board.grid
        self.pieces = board.pieces
        self.moves_made = board.moves_made

    # # This function isn't being used anywhere yet
    # def deep_copy(self, board):
    #     self.pieces.clear()
    #     for row in range(len(board.grid)):
    #         for column in range(len(row)):
    #             if (board.grid[row][column] != None):
    #                 self.grid[row][column] = board.grid[row][column].copy()
    #                 self.pieces.append(self.grid[row][column])
    #                 self.refresh_pieces()
    #             else:
    #                 self.grid[row][column] = None
    #     self.moves_made.clear()
    #     for move in board.moves_made:
    #         self.moves_made.append(move)
    #     self.refresh_pieces()

    def get_white_king_pos(self):
        return self.White_King_Pos

    def get_black_king_pos(self):
        return self.Black_King_Pos

    def get_white_king_moves(self):
        return self.get(self.White_King_Pos).steps_taken

    def get_black_king_moves(self):
        return self.get(self.Black_King_Pos).steps_taken

    def inc_white_king_moves(self):
        self.get(self.White_King_Pos).steps_taken += 1

    def inc_black_king_moves(self):
        self.get(self.Black_King_Pos).steps_taken += 1

    def dec_white_king_moves(self):
        self.get(self.White_King_Pos).steps_taken -= 1

    def dec_black_king_moves(self):
        self.get(self.Black_King_Pos).steps_taken -= 1

    def update_valid_moves(self):
        self.refresh_pieces()
        for piece in self.pieces:
            piece.update_valid_moves()
        self.refresh_pieces()

    def get(self, pos) -> Piece:
        return self.grid[pos[0]][pos[1]]

    def white_in_check(self):
        for piece in self.pieces:
            if (piece.color == 1 and self.White_King_Pos in piece.get_attack_moves()):
                return True

    def black_in_check(self):
        for piece in self.pieces:
            if (piece.color == 0 and self.Black_King_Pos in piece.get_attack_moves()):
                return True

    def kings_in_check(self):
        checks = [self.white_in_check(), self.black_in_check()]
        return checks

    def get_invalid_moves(self, piece: Piece):
        invalid_moves = []
        for move in piece.valid_moves:
            temp = self.grid[move[0]][move[1]]
            origin = [piece.row, piece.column]
            piece.move(move[0], move[1], checking=True)
            if (self.kings_in_check()[piece.color]):
                invalid_moves.append(move)
            piece.undo_move(origin[0], origin[1], temp)
            self.kings_in_check()[piece.color]
        self.refresh_pieces()
        return invalid_moves

    def all_valid_moves(self, color_to_check):
        moves = []
        for piece in self.pieces:
            if (piece.color == color_to_check):
                moves += piece.get_valid_moves()
        return moves

    def all_attack_moves(self, color_to_check):
        moves = []
        for piece in self.pieces:
            if (piece.color == color_to_check):
                moves += piece.get_attack_moves()
        return moves

    def no_valid_moves(self, color_to_move):
        for piece in self.pieces:
            if (piece.color == color_to_move and len(piece.get_valid_moves()) > 0):
                return False
        return True

    def format_valid_moves(self, piece: Piece):
        retstr = ""
        if (piece is None):
            return ""
        for move in piece.get_valid_moves():
            retstr += chr(move[1] + 97)+str(move[0]+1)+','
        return retstr[:-1]

    def get_dead(self):
        white = ""
        black = ""
        for piece in self.dead_white:
            if (type(piece) != Knight):
                white += str(type(piece)).split('.')[1][0].upper()
            else:
                white += "N"
        for piece in self.dead_black:
            if (type(piece) != Knight):
                black += str(type(piece)).split('.')[1][0].lower()
            else:
                black += "n"
        return [white, black]
