import pyglet

# Creates the user experience for displaying the game over state
class End(object):
    active = False
    def __init__(self):
        End.active = False
        self.color = 0
        self.pop_up = pyglet.window.Window(400, 200)
        self.pop_up.set_caption("Game over")
        self.pop_up.push_handlers(self)

        # Figure out how to center in the screen for any resolution.
        self.pop_up.set_location(500, 200)

        self.background = pyglet.image.SolidColorImagePattern((255, 255, 255, 255)).create_image(self.pop_up.width, self.pop_up.height)
        self.label_result = None
        self.label_exit = pyglet.text.Label('Click anywhere to exit',
                                font_name='Times New Roman',
                                font_size=15,
                                x=self.pop_up.width//2, y= 2*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
        self.mouse_clicked = False

    def on_draw(self):
        self.pop_up.clear()
        self.background.blit(0, 0)
        self.label_result.draw()
        self.label_exit.draw()

    def on_key_press(self, symbol, modifiers):
        return pyglet.event.EVENT_HANDLED

    def on_mouse_press(self, x, y, button, modifiers):
        self.mouse_clicked = True
    
    def stalemate(self):
        End.active = True
        self.label_result = pyglet.text.Label('Stalemate! Draw!',
                                font_name='Times New Roman',
                                font_size=25,
                                x=self.pop_up.width//2, y= 4*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))

        self.pop_up.set_exclusive_mouse(False)
        self.pop_up.set_exclusive_mouse(True)
        self.pop_up.set_mouse_platform_visible(True)
        self.pop_up.set_mouse_position(0, 0)
        while(not(self.mouse_clicked)):
            pyglet.clock.tick()
            self.pop_up.switch_to()
            self.pop_up.dispatch_events()
            self.pop_up.dispatch_event('on_draw')
            self.pop_up.flip()
            self.pop_up.set_mouse_visible(True)
        self.pop_up.set_exclusive_keyboard(False)
        self.pop_up.set_exclusive_mouse(False)
        self.pop_up.set_visible(False)
        self.pop_up.close()
        pyglet.app.exit()

    def checkmate(self, color = -1):
        End.active = True
        self.color = color
        if(self.color == 1):
            self.label_result = pyglet.text.Label('Checkmate! White Wins!',
                                font_name='Times New Roman',
                                font_size=25,
                                x=self.pop_up.width//2, y= 4*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
        elif(self.color == 0):
            self.label_result = pyglet.text.Label('Checkmate! Black Wins!',
                                font_name='Times New Roman',
                                font_size=25,
                                x=self.pop_up.width//2, y= 4*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
        else:
            self.label_result = pyglet.text.Label('Checkmate! ----- Wins!',
                                font_name='Times New Roman',
                                font_size=25,
                                x=self.pop_up.width//2, y= 4*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))

        self.pop_up.set_exclusive_mouse(False)
        self.pop_up.set_exclusive_mouse(True)
        self.pop_up.set_mouse_platform_visible(True)
        self.pop_up.set_mouse_position(0, 0)
        while(not(self.mouse_clicked)):
            pyglet.clock.tick()
            self.pop_up.switch_to()
            self.pop_up.dispatch_events()
            self.pop_up.dispatch_event('on_draw')
            self.pop_up.flip()
            self.pop_up.set_mouse_visible(True)
        self.pop_up.set_exclusive_keyboard(False)
        self.pop_up.set_exclusive_mouse(False)
        self.pop_up.set_visible(False)
        self.pop_up.close()
        pyglet.app.exit()