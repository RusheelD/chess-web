from GameMode import GameMode

class Chess(object):
    def __init__(self):
        game = GameMode().choose_mode()
        game.run()