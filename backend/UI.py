import pyglet
from GameControl import GameControl
from End import End

class UI(object):
    def __init__(self):
        self.scale = 800
        self.set_backgrounds()

        self.window = pyglet.window.Window(self.scale , self.scale)
        self.window.set_caption("Chess Game")
        self.window.set_location(300, 50)
        self.window.push_handlers(self)

        self.turn_count = 0

        self.game_over_frames = 0

        self.game = GameControl()
    
    def set_backgrounds(self):
        self.background_white = pyglet.image.SolidColorImagePattern((255, 255, 255, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_gray = pyglet.image.SolidColorImagePattern((75, 75, 75, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_select = pyglet.image.SolidColorImagePattern((0, 175, 0, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_option_dark = pyglet.image.SolidColorImagePattern((175, 175, 0, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_option_light = pyglet.image.SolidColorImagePattern((225, 225, 0, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_check = pyglet.image.SolidColorImagePattern((255, 0, 0, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_checkmate = pyglet.image.SolidColorImagePattern((150, 0, 0, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_stalemate = pyglet.image.SolidColorImagePattern((0, 0, 255, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_recent_light = pyglet.image.SolidColorImagePattern((125, 125, 255, 255)).create_image(self.scale // 8, self.scale // 8)
        self.background_recent_dark = pyglet.image.SolidColorImagePattern((75, 75, 255, 255)).create_image(self.scale // 8, self.scale // 8)

    def call_draw(self, dt):
        game_over = self.game.is_game_over()
        stalemate = game_over[0] and game_over[1] == -1
        checkmate = game_over[0] and not(stalemate)

        if(checkmate and self.game_over_frames >= 2):
            End().checkmate(game_over[1])
        if(stalemate and self.game_over_frames >= 2):
            End().stalemate()
        
        self.window.dispatch_event('on_draw')

    def on_draw(self):
        self.window.clear()
        in_check = self.game.in_check()
        game_over = self.game.is_game_over()
        stalemate = game_over[0] and game_over[1] == -1
        checkmate = game_over[0] and not(stalemate)
        

        for r in range(len(self.game.main_board.grid)):
            for col in range(len(self.game.main_board.grid[r])):
                row = abs(7 * self.game.color_to_move - r)
                column = abs(7 * self.game.color_to_move - col)
                piece = self.game.main_board.grid[row][column]

                if(self.game.is_piece_selected and self.game.selected_piece != None):
                    if([row, column] == [self.game.selected_piece.row, self.game.selected_piece.column]):
                        self.background_select.blit(self.scale // 8 * col, self.scale // 8 * r)
                    elif([row, column] in self.game.main_board.grid[self.game.selected_piece.row][self.game.selected_piece.column].get_valid_moves() and row%2 == column%2):
                        self.background_option_dark.blit(self.scale // 8 * col, self.scale // 8 * r)
                    elif([row, column] in self.game.main_board.grid[self.game.selected_piece.row][self.game.selected_piece.column].get_valid_moves()):
                        self.background_option_light.blit(self.scale // 8 * col, self.scale // 8 * r)
                    elif([row, column] in self.game.recent_move and r%2==col%2):
                        self.background_recent_dark.blit(self.scale // 8 * col, self.scale // 8 * r)
                    elif([row, column] in self.game.recent_move):
                        self.background_recent_light.blit(self.scale // 8 * col, self.scale // 8 * r)
                    elif(r%2 == col%2):
                        self.background_gray.blit(self.scale // 8 * col, self.scale // 8 * r)
                    else:
                        self.background_white.blit(self.scale // 8 * col, self.scale // 8 * r)
                elif([row, column] in self.game.recent_move and r%2==col%2):
                    self.background_recent_dark.blit(self.scale // 8 * col, self.scale // 8 * r)
                elif([row, column] in self.game.recent_move):
                    self.background_recent_light.blit(self.scale // 8 * col, self.scale // 8 * r)
                elif(r%2 == col%2):
                    self.background_gray.blit(self.scale // 8 * col, self.scale // 8 * r)
                else:
                    self.background_white.blit(self.scale // 8 * col, self.scale // 8 * r)
                
                if(game_over[0]):
                    if((game_over[1] == 0 and [row, column] == self.game.main_board.get_white_king_pos()) or (game_over[1] == 1 and [row, column] == self.game.main_board.get_black_king_pos())):
                        self.background_checkmate.blit(self.scale // 8 * col, self.scale // 8 * r)
                    elif(stalemate and ([row, column] == self.game.main_board.get_white_king_pos() or [row, column] == self.game.main_board.get_black_king_pos())):
                        self.background_stalemate.blit(self.scale // 8 * col, self.scale // 8 * r)
                elif(in_check and ((self.game.color_to_move == 0 and [row, column] == self.game.main_board.get_white_king_pos()) or (self.game.color_to_move == 1 and [row, column] == self.game.main_board.get_black_king_pos()))):
                    self.background_check.blit(self.scale // 8 * col, self.scale // 8 * r)

                if piece != None:
                    temp_sprite = pyglet.sprite.Sprite(piece.image, col * self.scale // 8, r * self.scale // 8)
                    temp_sprite.scale = 0.5 * (self.scale / 800)
                    temp_sprite.draw()
        
        if(self.turn_count < len(self.game.main_board.moves_made)):
            self.turn_count = len(self.game.main_board.moves_made)
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            self.window.dispatch_event('on_draw')
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            pyglet.clock.schedule_once(self.call_draw, .25)
        
        if(checkmate or stalemate):
            self.game_over_frames += 1
            if(self.game_over_frames == 2):
                pyglet.clock.schedule_once(self.call_draw, .1)
        else:
            self.game_over_frames = 0

    def on_key_press(self, symbol, modifiers):
        if(symbol == pyglet.window.key.L and not(self.game.loaded)):
            self.game.load_game()
            self.turn_count = len(self.game.main_board.moves_made)
            self.game_over_frames = 2
            pyglet.clock.schedule_once(self.call_draw, .1)
        else:
            return pyglet.event.EVENT_HANDLED
        
    def on_mouse_press(self, x, y, button, modifiers):

        r = int(y // (self.scale // 8))
        row = abs(7 * self.game.color_to_move - r)
        col = int(x // (self.scale // 8))
        column = abs(7 * self.game.color_to_move - col)

        self.game.select_tile(row, column)

    def on_close(self):
        pyglet.app.exit()
    
    def run(self):
        pyglet.app.run()
        self.game.store_history()