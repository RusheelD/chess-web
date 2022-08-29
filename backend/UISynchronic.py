import pyglet
from MultiGameControl import MultiGameControl
from End import End

class UI(object):
    def __init__(self):
        self.scale = 600
        self.set_backgrounds()

        self.make_windows()

        self.turn_count = 0

        self.game_over_frames = 0

        self.game = MultiGameControl()
    
    def make_windows(self):
        self.window_main = pyglet.window.Window(self.scale , self.scale, visible=False)
        self.window_main.set_caption("Chess Game - Main")
        self.window_main.set_location(550, 50)
        self.window_main.push_handlers(self)

        self.window_white = pyglet.window.Window(self.scale , self.scale)
        self.window_white.set_caption("Chess Game - White")
        self.window_white.set_location(100, 50)
        self.window_white.push_handlers(self)
        self.window_white.set_handler("on_mouse_press", self.mouse_press_white)
        self.window_white.set_handler("on_draw", self.draw_white)

        self.window_black = pyglet.window.Window(self.scale , self.scale)
        self.window_black.set_caption("Chess Game - Black")
        self.window_black.set_location(750, 50)
        self.window_black.push_handlers(self)
        self.window_black.set_handler("on_mouse_press", self.mouse_press_black)
        self.window_black.set_handler("on_draw", self.draw_black)

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

        if(checkmate and self.game_over_frames >= 2 and not End.active):
            End().checkmate(game_over[1])
        if(stalemate and self.game_over_frames >= 2 and not End.active):
            End().stalemate()
        
        self.window_main.dispatch_event('on_draw')
        self.window_white.dispatch_event('on_draw')
        self.window_black.dispatch_event('on_draw')

    def on_draw(self):
        self.window_main.clear()
        in_check = self.game.in_check()
        game_over = self.game.is_game_over()
        stalemate = game_over[0] and game_over[1] == -1
        checkmate = game_over[0] and not(stalemate)
        

        for r in range(len(self.game.main_board.grid)):
            for col in range(len(self.game.main_board.grid[r])):
                row = abs(7 * self.game.color_to_move - r)
                column = abs(7 * self.game.color_to_move - col)
                self.draw(r, col, row, column, game_over, stalemate, in_check, self.game.main_board)
        
        if(self.turn_count < len(self.game.main_board.moves_made)):
            self.turn_count = len(self.game.main_board.moves_made)
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            self.window_main.dispatch_event('on_draw')
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            pyglet.clock.schedule_once(self.call_draw, .25)
        
        if(checkmate or stalemate):
            self.game_over_frames += 1
            if(self.game_over_frames == 2):
                pyglet.clock.schedule_once(self.call_draw, .1)
        else:
            self.game_over_frames = 0

    def draw_white(self):
        self.window_white.clear()
        in_check = self.game.in_check(0)
        game_over = self.game.is_game_over()
        stalemate = game_over[0] and game_over[1] == -1
        checkmate = game_over[0] and not(stalemate)
        

        for r in range(len(self.game.white_board.grid)):
            for col in range(len(self.game.white_board.grid[r])):
                row = abs(7 * 0 - r)
                column = abs(7 * 0 - col)
                self.draw(r, col, row, column, game_over, stalemate, in_check, self.game.white_board)
        
        if(self.turn_count < len(self.game.main_board.moves_made)):
            self.turn_count = len(self.game.main_board.moves_made)
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            self.window_white.dispatch_event('on_draw')
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            pyglet.clock.schedule_once(self.call_draw, .25)
        
        if(checkmate or stalemate):
            self.game_over_frames += 1
            if(self.game_over_frames == 2):
                pyglet.clock.schedule_once(self.call_draw, .1)
        else:
            self.game_over_frames = 0

    def draw_black(self):
        self.window_black.clear()
        in_check = self.game.in_check(1)
        game_over = self.game.is_game_over()
        stalemate = game_over[0] and game_over[1] == -1
        checkmate = game_over[0] and not(stalemate)
        

        for r in range(len(self.game.black_board.grid)):
            for col in range(len(self.game.black_board.grid[r])):
                row = abs(7 * 1 - r)
                column = abs(7 * 1 - col)
                self.draw(r, col, row, column, game_over, stalemate, in_check, self.game.black_board)
        
        if(self.turn_count < len(self.game.main_board.moves_made)):
            self.turn_count = len(self.game.main_board.moves_made)
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            self.window_black.dispatch_event('on_draw')
            self.game.color_to_move = abs(self.game.color_to_move - 1)
            pyglet.clock.schedule_once(self.call_draw, .25)
        
        if(checkmate or stalemate):
            self.game_over_frames += 1
            if(self.game_over_frames == 2):
                pyglet.clock.schedule_once(self.call_draw, .1)
        else:
            self.game_over_frames = 0

    def draw(self, r, col, row, column, game_over, stalemate, in_check, board):
        piece = board.grid[row][column]
        if(board is self.game.white_board):
            ips = self.game.is_piece_selected_white
            sp = self.game.selected_piece_white
            color = 0
        elif(board is self.game.black_board):
            ips = self.game.is_piece_selected_black
            sp = self.game.selected_piece_black
            color = 1
        else:
            ips = self.game.is_piece_selected
            sp = self.game.selected_piece
            color = self.game.color_to_move

        if(ips and sp != None and board.grid[sp.row][sp.column] != None):
            if([row, column] == [sp.row, sp.column]):
                self.background_select.blit(self.scale // 8 * col, self.scale // 8 * r)
            elif([row, column] in board.grid[sp.row][sp.column].get_valid_moves() and row%2 == column%2):
                self.background_option_dark.blit(self.scale // 8 * col, self.scale // 8 * r)
            elif([row, column] in board.grid[sp.row][sp.column].get_valid_moves()):
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
            if((game_over[1] == 0 and [row, column] == board.get_white_king_pos()) or (game_over[1] == 1 and [row, column] == board.get_black_king_pos())):
                self.background_checkmate.blit(self.scale // 8 * col, self.scale // 8 * r)
            elif(stalemate and ([row, column] == board.get_white_king_pos() or [row, column] == board.get_black_king_pos())):
                self.background_stalemate.blit(self.scale // 8 * col, self.scale // 8 * r)
        elif((board.white_in_check() and [row, column] == board.get_white_king_pos()) or (board.black_in_check() and [row, column] == board.get_black_king_pos())):
            self.background_check.blit(self.scale // 8 * col, self.scale // 8 * r)

        if piece != None:
            temp_sprite = pyglet.sprite.Sprite(piece.image, col * self.scale // 8, r * self.scale // 8)
            temp_sprite.scale = 0.5 * (self.scale / 800)
            temp_sprite.draw()

    def on_key_press(self, symbol, modifiers):
        if(symbol == pyglet.window.key.L and not(self.game.loaded)):
            self.game.load_game()
            self.turn_count = len(self.game.main_board.moves_made)
            self.game_over_frames = 2
            pyglet.clock.schedule_once(self.call_draw, .1)
        elif(symbol == pyglet.window.key.S):
            self.game.sync_boards()
        else:
            return pyglet.event.EVENT_HANDLED
        
    def on_mouse_press(self, x, y, button, modifiers):

        r = int(y // (self.scale // 8))
        row = abs(7 * self.game.color_to_move - r)
        col = int(x // (self.scale // 8))
        column = abs(7 * self.game.color_to_move - col)

        self.game.select_tile(row, column, board=self.game.main_board)

    def mouse_press_white(self, x, y, button, modifiers):
        if(self.game.white_moved == True):
            return pyglet.event.EVENT_HANDLED
        
        r = int(y // (self.scale // 8))
        row = r
        col = int(x // (self.scale // 8))
        column = col

        self.game.select_tile(row, column, board=self.game.white_board)

    def mouse_press_black(self, x, y, button, modifiers):
        if(self.game.black_moved == True):
            return pyglet.event.EVENT_HANDLED
        
        r = int(y // (self.scale // 8))
        row = abs(7 * 1 - r)
        col = int(x // (self.scale // 8))
        column = abs(7 * 1 - col)

        self.game.select_tile(row, column, board=self.game.black_board)

    def on_close(self):
        pyglet.app.exit()
    
    def run(self):
        pyglet.app.run()
        self.game.store_history()