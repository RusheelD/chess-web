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
        self.socketIO = flask_socketio.SocketIO(
            self.app, cors_allowed_origins='*')
        self.users = AllPlayersData()


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
        if (player.code in self.players):
            return self
        if (player.code == ""):
            return self
        if (len(self.players) == 0):
            color = "white"
        elif (len(self.players) == 1):
            color = "black"
        else:
            color = "guest"
        self.players.update({player.code: {"player": player, "color": color}})
        return self

    def to_dict(self, usercode=None):
        ret = {}
        for player in self.players:
            if player == usercode:
                d = self.players[player]["player"].__dict__.copy()
                d.update({"color": self.players[player]["color"]})
                ret.update({player: d})
            else:
                ret.update({player: {
                    "name": self.players[player]["player"].name, "color": self.players[player]["color"]}})
        return ret

    def __getitem__(self, item):
        return self.players[item]


# Initialize the app manager
app_manager = AppManager(app)


@app_manager.app.route('/')
def i():
    return flask.redirect(flask.url_for('index'))

# Route to index page,


@app_manager.app.route("/index", methods=['GET', 'POST'])
def index():
    return {"status": "OK"}


@app_manager.app.route("/add", methods=['GET', 'POST'])
def add():
    data = dict(flask.request.json)
    usercode = data.get("code")
    username = data.get("name")
    userid = data.get('id')
    app_manager.users.add(PlayerData(usercode, username, userid))
    return app_manager.users.to_dict(usercode)


@app_manager.app.route("/make", methods=['GET', 'POST'])
def make():
    data = dict(flask.request.json)
    gamecode = data.get("code")
    player = app_manager.users[data.get('usercode')]["player"]
    if gamecode not in app_manager.games:
        mode = data.get('mode')
        gameType = data.get('type')
        if (mode == 'synchronic'):
            app_manager.games[gamecode] = GameData(
                MultiGameControl(), 0, AllPlayersData().add(player))
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
    flask_socketio.emit("select", board(data.get('code')),
                        namespace='/', broadcast=True)
    return board(code=gamecode, usercode=data.get("usercode"))


@app_manager.app.route("/board", methods=["GET", "POST"])
def board(code=None, usercode=None):
    game = None
    if (code):
        game = app_manager.games[code].game
    else:
        data = dict(flask.request.json)
        code = data.get('code')
        usercode = data.get('usercode')
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
        "users": app_manager.games[code].users.to_dict(usercode)
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
        flask_socketio.emit("select", board(data.get('code')),
                            namespace='/', broadcast=True)
    return "selected"


@app_manager.socketIO.on("select")
def handle_select(data):
    code, tile, choice = data
    game = app_manager.games[code].game
    if (game is None):
        return
    tup = (int(tile[1]) - 1, ord(tile[0])-97)
    game.select_tile(tup[0], tup[1], choice=choice)
    if (not (game.is_piece_selected)):
        flask_socketio.emit("select", board(
            code), namespace='/', broadcast=True)


@app_manager.app.route("/reset", methods=['GET', 'POST'])
def reset():
    data = dict(flask.request.json)
    game = app_manager.games[data.get('code')].game
    app_manager.games[data.get('code')] = GameData(
        type(game)(), 0, app_manager.games[data.get('code')].users)
    return board(code=data.get('code'))


@app_manager.app.route("/logout", methods=['GET', 'POST'])
def logout():
    data = dict(flask.request.json)
    code = data.get('usercode')
    game = app_manager.games[data.get('code')].game
    app_manager.games[data.get('code')].users.players.pop(code, None)
    app_manager.users.players.pop(code, None)
    if (len(app_manager.games[data.get('code')].users.players) == 0):
        app_manager.games.pop(data.get('code'), None)
        app_manager.games.update({data.get('code'): GameData(
            type(game)(), 0, AllPlayersData())})
    else:
        app_manager.games[data.get('code')] = GameData(
            type(game)(), 0, app_manager.games[data.get('code')].users)
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
    app_manager.socketIO.run(app_manager.app, debug=True,
                             allow_unsafe_werkzeug=True, host='0.0.0.0')
