import json

import flask
import flask_socketio
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
        self.socketIo = flask_socketio.SocketIO(
            self.app, cors_allowed_origins='*')


class GameData():
    def __init__(self, game, logins, users):
        self.game = game
        self.logins = logins
        self.users = users


class PlayerData():
    def __init__(self, code, name="", userId=""):
        self.code = code
        self.name = name
        self.userId = userId


class AllPlayersData():
    def __init__(self):
        self.players = {}

    def add(self, player: PlayerData):
        if (len(self.players) == 0):
            color = "white"
        elif (len(self.players) == 1):
            color = "black"
        else:
            color = "guest"
        self.players.update({player.code: {"player": player, "color": color}})
        return self

    def to_dict(self):
        ret = {}
        for player in self.players:
            ret.update({player: {
                       "player": self.players[player]["player"].name, "color": self.players[player]["color"]}})
        return ret


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
    gamecode = data.get("code")
    player = PlayerData(data.get("usercode"), data.get("name"), data.get("id"))
    if gamecode not in app_manager.games:
        mode = data.get('mode')
        gameType = data.get('type')
        if (mode == 'synchronic'):
            app_manager.games[gamecode] = GameData(
                MultiGameControl(), 0, [])
        elif (mode == 'classic'):
            if (gameType == 'ai'):
                app_manager.games[gamecode] = GameData(
                    AIControl(), 0, AllPlayersData().add(player))
            elif (gameType == "network"):
                app_manager.games[gamecode] = GameData(
                    GameControl(), 0, AllPlayersData().add(player))
            else:
                app_manager.games[gamecode] = GameData(
                    GameControl(), 0, AllPlayersData().add(player))
        return board(code=gamecode)
    app_manager.games[gamecode].logins += 1
    if (player.code not in app_manager.games[gamecode].users.players):
        app_manager.games[gamecode].users.add(player)
    return board(code=gamecode)


@app_manager.app.route("/board", methods=["GET", "POST"])
def board(code=None):
    game = None
    if (code):
        game = app_manager.games[code].game
    else:
        data = dict(flask.request.json)
        code = data.get('code')
        game = app_manager.games[data.get('code')].game
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
        "logged": app_manager.games[code].logins,
        "users": app_manager.games[code].users.to_dict()
    }


@app_manager.app.route("/select", methods=['GET', 'POST'])
def select():
    data = dict(flask.request.json)
    game = app_manager.games[data.get('code')].game
    if (flask.request.method == 'POST'):
        if (game is None):
            return
        tile = data.get('tile')
        choice = data.get('choice')
        tup = (int(tile[1]) - 1, ord(tile[0])-97)
        game.select_tile(tup[0], tup[1], choice=choice)
    if (not (game.is_piece_selected)):
        flask_socketio.emit("select", board(), namespace='/', broadcast=True)
    return "selected"


@app_manager.socketIo.on("select")
def handle_select(data):
    code, tile, choice = data
    game = app_manager.games[code].game
    if (game is None):
        return
    tup = (int(tile[1]) - 1, ord(tile[0])-97)
    game.select_tile(tup[0], tup[1], choice=choice)
    if (not (game.is_piece_selected)):
        flask_socketio.emit("select", board(), namespace='/', broadcast=True)


@app_manager.app.route("/reset", methods=['GET', 'POST'])
def reset():
    data = dict(flask.request.json)
    game = app_manager.games[data.get('code')].game
    app_manager.games[data.get('code')] = GameData(type(game)(), 0, game.users)
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
