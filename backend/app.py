import json

import flask
from AIControl import AIControl
from GameControl import GameControl
from MultiGameControl import MultiGameControl

# Initialize the app and the login manager
app = flask.Flask(__name__)

# AppManager class to contain and handle the details of a specific app and login manager
# to maintain the state and manage the logic


class AppManager():
    def __init__(self, app):
        self.app = app
        self.updated_data = None
        self.game = None

    def updateLogout(self):
        self.can_logout = not (self.can_logout)


# Initialize the app manager
app_manager = AppManager(app)


@app_manager.app.route('/')
def i():
    return flask.redirect(flask.url_for('index'))

# Route to index page,


@app_manager.app.route("/index", methods=['GET', 'POST'])
def index():
    return {"status": "OK"}


@app_manager.app.route("/make", methods=['GET', 'POST'])
def make():
    if flask.request.method == 'POST':
        data = dict(flask.request.json)
        mode = data.get('mode')
        if (mode == 'synchronic'):
            app_manager.game = MultiGameControl()
        elif (mode == 'oneplayer'):
            app_manager.game = AIControl()
        else:
            app_manager.game = GameControl()
        return board()
    app_manager.game = GameControl()
    return board()


@app_manager.app.route("/board", methods=["GET", "POST"])
def board():
    if (app_manager.game is None):
        app_manager.game = GameControl()
    return {
        "board": app_manager.game.main_board.to_fen(),
        "possible": app_manager.game.main_board.format_valid_moves(app_manager.game.selected_piece),
        "dead_white": app_manager.game.main_board.get_dead()[0],
        "dead_black": app_manager.game.main_board.get_dead()[1],
        "move_counts": app_manager.game.main_board.move_count_fen()
    }


@app_manager.app.route("/select", methods=['GET', 'POST'])
def select():
    if (flask.request.method == 'POST'):
        if (app_manager.game is None):
            return
        data = dict(flask.request.json)
        tile = data.get('tile')
        tup = (int(tile[1]) - 1, ord(tile[0])-97)
        app_manager.game.select_tile(tup[0], tup[1])
    return "selected"


@app_manager.app.route("/reset", methods=['GET', 'POST'])
def reset():
    app_manager.game = type(app_manager.game)()
    flask.Flask.logger
    return board()


@app_manager.app.route("/synchronic")
def synchronic():
    pass


@app_manager.app.route("/singleplayer")
def ai():
    pass


@app_manager.app.route("/twoplayer")
def classic():
    pass


if (__name__ == '__main__'):
    app.run()
