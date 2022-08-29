import random
from Board import Board
from GameControl import GameControl

class MultiGameControl(GameControl):
    def __init__(self):
        super().__init__()
        self.is_piece_selected_white = False
        self.selected_piece_white = None
        self.white_move = None
        self.black_move = None
        self.is_piece_selected_black = False
        self.selected_piece_black = None
        self.black_moved = False
        self.white_moved = False
        self.black_priority = 0
        self.white_prioirty = 0
        self.main_board = Board()
        self.white_board = Board()
        self.black_board = Board()
        self.color_to_move = 0
        self.chosen_color = -1
        self.loaded = False
    
    def sync_boards(self):
        self.white_board.copy(self.main_board)
        self.black_board.copy(self.main_board)

    def is_game_over(self):
        if(self.black_board.no_valid_moves(1) or self.white_board.no_valid_moves(0)):
            if(self.black_board.black_in_check()):
                return [True, 1]
            elif(self.white_board.white_in_check()):
                return [True, 0]
            else:
                return [True, -1]
        return [False, -1]

    def in_check(self, color = -1):
        if color == -1:
            color = self.color_to_move
        return self.main_board.kings_in_check()[color]

    def select_tile(self, row, column, choice=None, board: Board=None):
        if(board is self.white_board):
            self.chosen_color = 0
        elif(board is self.black_board):
            self.chosen_color = 1
        else:
            board = self.main_board
            self.chosen_color = -1
        
        if(board.grid[row][column] == None and 
                ((not(self.is_piece_selected_white) and self.chosen_color==0) or 
                (not(self.is_piece_selected_black) and self.chosen_color==1) or 
                (not(self.is_piece_selected) and self.chosen_color == -1))):
            if(self.chosen_color == 0):
                self.is_piece_selected_white = False
                self.selected_piece_white = None
            elif(self.chosen_color == 1):
                self.is_piece_selected_black = False
                self.selected_piece_black = None
            else:
                self.is_piece_selected = False
                self.selected_piece = None

        elif((not(self.is_piece_selected_white) and self.chosen_color==0) or 
                (not(self.is_piece_selected_black) and self.chosen_color==1) or 
                (not(self.is_piece_selected) and self.chosen_color == -1)):
            if((self.chosen_color != -1 and board.grid[row][column].color != self.chosen_color) or (board.grid[row][column].color != self.color_to_move and self.chosen_color == -1)):
                return None
            if(self.chosen_color == 0):
                self.is_piece_selected_white = True
                self.selected_piece_white = self.main_board.grid[row][column]
            elif(self.chosen_color == 1):
                self.is_piece_selected_black = True
                self.selected_piece_black = self.main_board.grid[row][column]
            else:
                self.is_piece_selected = True
                self.selected_piece = self.main_board.grid[row][column]

        elif((self.selected_piece and self.selected_piece.row == row and self.selected_piece.column == column and self.chosen_color == -1) or 
                (self.selected_piece_white and self.selected_piece_white.row == row and self.selected_piece_white.column == column and self.chosen_color == 0) or 
                (self.selected_piece_black and self.selected_piece_black.row == row and self.selected_piece_black.column == column and self.chosen_color == 1)):
            if(self.chosen_color == 0):
                self.is_piece_selected_white = False
                self.selected_piece_white = None
            elif(self.chosen_color == 1):
                self.is_piece_selected_black = False
                self.selected_piece_black = None
            else:
                self.is_piece_selected = False
                self.selected_piece = None
        
        elif((self.selected_piece and self.chosen_color == -1 and [row, column] in self.selected_piece.get_valid_moves()) or 
                (self.selected_piece_white and self.chosen_color == 0 and [row, column] in board.grid[self.selected_piece_white.row][self.selected_piece_white.column].get_valid_moves()) or 
                (self.selected_piece_black and self.chosen_color == 1 and [row, column] in board.grid[self.selected_piece_black.row][self.selected_piece_black.column].get_valid_moves())):

            if(self.chosen_color == 0 and not self.white_moved):
                self.white_move = [self.selected_piece_white, row, column]
                self.white_moved = True
                self.is_piece_selected_white = False
            elif(self.chosen_color == 1 and not self.black_moved):
                self.black_move = [self.selected_piece_black, row, column]
                self.black_moved = True
                self.is_piece_selected_black = False
            else:
                self.recent_move = [[self.selected_piece.row, self.selected_piece.column], [row, column]]
                self.selected_piece.move(row, column)
                self.color_to_move = abs(self.color_to_move - 1)
                self.is_piece_selected = False
                self.selected_piece = None
                board.update_valid_moves()
                self.sync_boards()
                return self.selected_piece
            
            if(self.white_moved and self.black_moved):

                if(board.kings_in_check()[0]):
                    self.white_priority = 1
                    self.black_priority = 0
                elif(board.kings_in_check()[1]):
                    self.black_priority = 1
                    self.white_priority = 0
                
                if(self.black_priority == self.white_prioirty):
                    if(self.white_move[0].speed > self.black_move[0].speed):
                        self.recent_move = [[self.white_move[0].row, self.white_move[0].column], [self.white_move[1], self.white_move[2]]]
                        self.white_move[0].move(self.white_move[1], self.white_move[2])
                        if(self.main_board.grid[self.black_move[0].row][self.black_move[0].column] == self.black_move[0] and ([self.black_move[1], self.black_move[2]] in self.black_move[0].get_valid_moves())):
                            self.recent_move += [[self.black_move[0].row, self.black_move[0].column], [self.black_move[1], self.black_move[2]]]
                            self.black_move[0].move(self.black_move[1], self.black_move[2])
                        else:
                            self.black_priority = 1
                    elif(self.white_move[0].speed < self.black_move[0].speed):
                        self.recent_move = [[self.black_move[0].row, self.black_move[0].column], [self.black_move[1], self.black_move[2]]]
                        self.black_move[0].move(self.black_move[1], self.black_move[2])
                        if(self.main_board.grid[self.white_move[0].row][self.white_move[0].column] == self.white_move[0] and ([self.white_move[1], self.white_move[2]] in self.white_move[0].get_valid_moves())):
                            self.recent_move += [[self.white_move[0].row, self.white_move[0].column], [self.white_move[1], self.white_move[2]]]
                            self.white_move[0].move(self.white_move[1], self.white_move[2])
                        else:
                            self.white_priority = 1
                    else:
                        first = random.choice([self.white_move, self.black_move])
                        if(first == self.white_move):
                            second = self.black_move
                        else:
                            second = self.white_move
                        
                        self.recent_move = [[first[0].row, first[0].column], [first[1], first[2]]]
                        first[0].move(first[1], first[2])
                        if(self.main_board.grid[second[0].row][second[0].column] == second[0] and ([second[1], second[2]] in second[0].get_valid_moves())):
                            self.recent_move += [[second[0].row, second[0].column], [second[1], second[2]]]
                            second[0].move(second[1], second[2])
                        elif(second == self.white_move):
                            self.white_prioirty = 1
                        else:
                            self.black_priority = 1
                elif(self.black_priority > self.white_prioirty):
                    self.recent_move = [[self.black_move[0].row, self.black_move[0].column], [self.black_move[1], self.black_move[2]]]
                    self.black_move[0].move(self.black_move[1], self.black_move[2])
                    self.black_priority = 0
                    if(self.main_board.grid[self.white_move[0].row][self.white_move[0].column] == self.white_move[0] and ([self.white_move[1], self.white_move[2]] in self.white_move[0].get_valid_moves())):
                        self.recent_move += [[self.white_move[0].row, self.white_move[0].column], [self.white_move[1], self.white_move[2]]]
                        self.white_move[0].move(self.white_move[1], self.white_move[2])
                    else:
                        self.white_priority = 1
                else:
                    self.recent_move = [[self.white_move[0].row, self.white_move[0].column], [self.white_move[1], self.white_move[2]]]
                    self.white_move[0].move(self.white_move[1], self.white_move[2])
                    self.white_priority = 0
                    if(self.main_board.grid[self.black_move[0].row][self.black_move[0].column] == self.black_move[0] and ([self.black_move[1], self.black_move[2]] in self.black_move[0].get_valid_moves())):
                        self.recent_move += [[self.black_move[0].row, self.black_move[0].column], [self.black_move[1], self.black_move[2]]]
                        self.black_move[0].move(self.black_move[1], self.black_move[2])
                    else:
                        self.black_priority = 1
                
                self.sync_boards()
                self.is_piece_selected_white = False
                self.selected_piece_white = None
                self.white_moved = False
                self.white_move = None
                self.is_piece_selected_black = False
                self.selected_piece_black = None
                self.black_moved = False
                self.black_move = None
                board.update_valid_moves()
                return self.selected_piece

        elif(board.grid[row][column] != None and ((self.chosen_color != -1 and board.grid[row][column].color == self.chosen_color) or (board.grid[row][column].color == self.color_to_move and self.chosen_color == -1))):
            if(self.chosen_color == 0):
                self.is_piece_selected_white = True
                self.selected_piece_white = self.main_board.grid[row][column]
            elif(self.chosen_color == 1):
                self.is_piece_selected_black = True
                self.selected_piece_black = self.main_board.grid[row][column]
            else:
                self.is_piece_selected = True
                self.selected_piece = self.main_board.grid[row][column]
        return self.selected_piece

    def store_history(self):
        with open("RecentGameSynchronic.txt", 'w') as storage:
            cols = "ABCDEFGH" 

            for i in range(len(self.main_board.moves_made)):
                storage.write(str(self.main_board.moves_made[i][0]) + " " + 
                str(self.main_board.moves_made[i][1]) + "\t" + 
                str(cols[self.main_board.moves_made[i][3]]) + 
                str(self.main_board.moves_made[i][2] + 1) + " " + 
                str(cols[self.main_board.moves_made[i][5]]) + 
                str(self.main_board.moves_made[i][4] + 1))
                storage.write("\n")