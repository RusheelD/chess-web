import pyglet

from UI import UI as UI
from UIAI import UI as UiAi
from UISynchronic import UI as UiSynchronic
from ColorChoice import ColorChoice

class GameMode(object):
    def __init__(self):
        self.choices = [0, 0, 0]
        self.UIs = [UiSynchronic, UI, UiAi]
        self.color = 0

        self.pop_up = pyglet.window.Window(len(self.choices) * 150, 200, visible=False)
        self.pop_up.set_caption("Choose Game Mode")
        self.pop_up.push_handlers(self)
        self.pop_up.set_location(500, 200)

        self.background = pyglet.image.SolidColorImagePattern((255, 255, 255, 255)).create_image(self.pop_up.width, self.pop_up.height)
        self.label_head = pyglet.text.Label('What game mode do you want to play?',
                                font_name='Times New Roman',
                                font_size=15,
                                x=self.pop_up.width//2, y= 5*self.pop_up.height//6,
                                anchor_x='center', anchor_y='center', color=(0, 0, 0, 255))
        self.label_choice = pyglet.text.Label('(S)ynchronic\t\t(T)wo-player\t\t(O)ne-player',
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
        if (symbol == pyglet.window.key.S):
            self.choices[0] = 1
        elif (symbol == pyglet.window.key.T):
            self.choices[1] = 1
        elif (symbol == pyglet.window.key.O):
            self.choices[2] = 1
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

    def choose_mode(self, choice=None):
        if choice and (choice == 'S' or choice == 'O' or choice == 'T'):
            self.pop_up.close()
            return self.UIs[0]() if choice == 'S' else (self.UIs[1]() if choice == 'T' else self.UIs[2](ColorChoice().choose_color()))

        self.pop_up.set_visible()
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
                if(i == 2):
                    return self.UIs[i](ColorChoice().choose_color())
                return self.UIs[i]()