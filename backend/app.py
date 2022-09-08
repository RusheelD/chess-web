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
        self.games = {}

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
    data = dict(flask.request.json)
    if data.get('code') not in app_manager.games:
        mode = data.get('mode')
        if (mode == 'synchronic'):
            app_manager.games[data.get('code')] = [MultiGameControl(), 0]
        elif (mode == 'oneplayer'):
            app_manager.games[data.get('code')] = [AIControl(), 0]
        else:
            app_manager.games[data.get('code')] = [GameControl(), 0]
        return board(code=data.get('code'))
    app_manager.games[data.get('code')][1] += 1
    return board(code=data.get('code'))


@app_manager.app.route("/board", methods=["GET", "POST"])
def board(code=None):
    game = None
    if (code):
        game = app_manager.games[code][0]
    else:
        data = dict(flask.request.json)
        code = data.get('code')
        game = app_manager.games[data.get('code')]
    return {
        "board": game.main_board.to_fen(),
        "possible": game.main_board.format_valid_moves(game.selected_piece),
        "dead_white": game.main_board.get_dead()[0],
        "dead_black": game.main_board.get_dead()[1],
        "move_counts": game.main_board.move_count_fen(),
        "recent": game.send_recent(),
        "current_player": game.current_player(),
        "current_piece": game.current_piece(),
        "check": game.send_check(),
        "checkmate": game.send_checkmate(),
        "stalemate": game.send_stalemate(),
        "logged": app_manager.games[code][1]
    }


@app_manager.app.route("/select", methods=['GET', 'POST'])
def select():
    data = dict(flask.request.json)
    game = app_manager.games[data.get('code')][0]
    if (flask.request.method == 'POST'):
        if (game is None):
            return
        tile = data.get('tile')
        choice = data.get('choice')
        tup = (int(tile[1]) - 1, ord(tile[0])-97)
        game.select_tile(tup[0], tup[1], choice=choice)
    return "selected"


@app_manager.app.route("/reset", methods=['GET', 'POST'])
def reset():
    data = dict(flask.request.json)
    game = app_manager.games[data.get('code')][0]
    app_manager.games[data.get('code')] = [type(game)(), 0]
    return board(code=data.get('code'))


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
