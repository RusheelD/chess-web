import os

import pyglet

pieces = pyglet.image.load(os.path.relpath("C:/code/github/chess-web/backend/Pieces-Images.png"))

Black_Queen_Image = pieces.get_region(200, 0, 200, 200)
White_Queen_Image = pieces.get_region(200, 200, 200, 200)

Black_Bishop_Image = pieces.get_region(400, 0, 200, 200)
White_Bishop_Image = pieces.get_region(400, 200, 200, 200)

Black_Knight_Image = pieces.get_region(600, 0, 200, 200)
White_Knight_Image = pieces.get_region(600, 200, 200, 200)

Black_Rook_Image = pieces.get_region(800, 0, 200, 200)
White_Rook_Image = pieces.get_region(800, 200, 200, 200)

class Promote(object):
    active = False
    def __init__(self):
        Promote.active = False
        self.queens = [pyglet.sprite.Sprite(White_Queen_Image, 0, 0), pyglet.sprite.Sprite(Black_Queen_Image, 0, 0)]
        self.queens[0].scale = 0.5
        self.queens[1].scale = 0.5

        self.rooks = [pyglet.sprite.Sprite(White_Rook_Image, 100, 0), pyglet.sprite.Sprite(Black_Rook_Image, 100, 0)]
        self.rooks[0].scale = 0.5
        self.rooks[1].scale = 0.5

        self.bishops = [pyglet.sprite.Sprite(White_Bishop_Image, 200, 0), pyglet.sprite.Sprite(Black_Bishop_Image, 200, 0)]
        self.bishops[0].scale = 0.5
        self.bishops[1].scale = 0.5

        self.knights = [pyglet.sprite.Sprite(White_Knight_Image, 300, 0), pyglet.sprite.Sprite(Black_Knight_Image, 300, 0)]
        self.knights[0].scale = 0.5
        self.knights[1].scale = 0.5

        self.sprites = [self.queens, self.rooks, self.bishops, self.knights]
        self.pieces = ["Queen", "Rook", "Bishop", "Knight"]
        self.color = 0
        self.choices = [0, 0, 0, 0]
        self.pop_up = pyglet.window.Window(len(self.choices) * 100, 200)
        self.pop_up.set_caption("Choose promotion")
        self.pop_up.push_handlers(self)
        self.pop_up.set_location(500, 200)

        self.background = pyglet.image.SolidColorImagePattern((255, 255, 255, 255)).create_image(self.pop_up.width, self.pop_up.height)
        self.label = pyglet.text.Label('What do you want to promote your pawn to?',
                                font_name='Times New Roman',
                                font_size=15,
                                x=self.pop_up.width//2, y= 5*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))

    def on_draw(self):
        self.pop_up.clear()
        self.background.blit(0, 0)
        self.label.draw()
        for sprite in self.sprites:
            sprite[0].draw()

    def on_mouse_press(self, x, y, button, modifiers):

        column = self.pop_up._mouse_x // 100
        row = self.pop_up._mouse_y // 100

        if row == 0:
            self.choices[column] = 1
    
    def on_key_press(self, symbol, modifiers):
        if (symbol == pyglet.window.key.Q):
            self.choices[0] = 1
        elif (symbol == pyglet.window.key.R):
            self.choices[1] = 1
        elif (symbol == pyglet.window.key.B):
            self.choices[2] = 1
        elif (symbol == pyglet.window.key.N):
            self.choices[3] = 1
        return pyglet.event.EVENT_HANDLED

    def on_mouse_motion(self, x, y, dx, dy):
        self.pop_up._mouse_x = self.pop_up._mouse_x + dx
        self.pop_up._mouse_y = self.pop_up._mouse_y + dy

        if self.pop_up._mouse_x > self.pop_up.width:
            self.pop_up._mouse_x = self.pop_up.width
        elif self.pop_up._mouse_x < 0:
            self.pop_up._mouse_x = 0
        
        if self.pop_up._mouse_y > self.pop_up.height:
            self.pop_up._mouse_y = self.pop_up.height
        elif self.pop_up._mouse_y < 0:
            self.pop_up._mouse_y = 0
        

    def on_close(self):
        self.choices[0] = 1

    def promote(self, given_color = 0):
        Promote.active = True
        self.color = given_color
        self.queens.pop(abs(self.color-1))
        self.rooks.pop(abs(self.color-1))
        self.bishops.pop(abs(self.color-1))
        self.knights.pop(abs(self.color-1))

        self.pop_up.set_exclusive_mouse(False)
        self.pop_up.set_exclusive_mouse(True)
        self.pop_up.set_mouse_platform_visible(True)
        self.pop_up.set_mouse_position(0, 0)
        while(not(1 in self.choices)):
            pyglet.clock.tick()
            self.pop_up.switch_to()
            self.pop_up.dispatch_events()
            self.pop_up.dispatch_event('on_draw')
            self.pop_up.flip()
            self.pop_up.activate()
            self.pop_up.set_exclusive_keyboard(True)
            self.pop_up.set_mouse_visible(True)
        self.pop_up.set_exclusive_keyboard(False)
        self.pop_up.set_exclusive_mouse(False)
        self.pop_up.set_visible(False)
        self.pop_up.close()

        for i in range(len(self.choices)):
            if self.choices[i] == 1:
                Promote.active = False
                return(self.pieces[i])