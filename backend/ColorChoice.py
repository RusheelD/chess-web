import pyglet

class ColorChoice(object):
    def __init__(self):
        self.choices = [0, 0]
        self.colors = [1, 0]
        self.color = 0

        self.pop_up = pyglet.window.Window(len(self.choices) * 150, 200)
        self.pop_up.set_caption("Choose Game Mode")
        self.pop_up.push_handlers(self)
        self.pop_up.set_location(500, 200)

        self.background = pyglet.image.SolidColorImagePattern((255, 255, 255, 255)).create_image(self.pop_up.width, self.pop_up.height)
        self.label_head = pyglet.text.Label('What color do you want to play?',
                                font_name='Times New Roman',
                                font_size=15,
                                x=self.pop_up.width//2, y= 5*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
        self.label_choice = pyglet.text.Label('(W)hite\t\t(B)lack',
                                font_name='Times New Roman',
                                font_size=15,
                                x=self.pop_up.width//2, y= 3*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))

    def on_draw(self):
        self.pop_up.clear()
        self.background.blit(0, 0)
        self.label_head.draw()
        self.label_choice.draw()
 
    def on_key_press(self, symbol, modifiers):
        if (symbol == pyglet.window.key.W):
            self.choices[0] = 1
        elif (symbol == pyglet.window.key.B):
            self.choices[1] = 1
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
        self.choices[1] = 1

    def choose_color(self):
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
                return self.colors[i]