from AIControl import AIControl
from GameControl import GameControl
from MultiGameControl import MultiGameControl

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

import socketio
import uvicorn

fastapp = FastAPI()
fastapp.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
socket_manager = socketio.AsyncServer(
    async_mode='asgi', cors_allowed_origins='*')
app = socketio.ASGIApp(socket_manager, fastapp)


class GameData():
    def __init__(self, game, logins, users):
        self.game: GameControl = game
        self.logins = logins
        self.users: AllPlayersData = users


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


class AppManager():
    def __init__(self, app, socket_manager):
        self.app = app
        self.updated_data = None
        self.games: dict[str, GameData] = {}
        self.socket_manager = socket_manager
        self.users = AllPlayersData()


app_manager = AppManager(app, socket_manager)


@app_manager.app.other_asgi_app.get('/')
def root_get():
    return RedirectResponse(url='/index')


@app_manager.app.other_asgi_app.post('/')
def root_post():
    return RedirectResponse(url='/index')


@app_manager.app.other_asgi_app.post('/index')
def index_get():
    return {"status": "OK"}


@app_manager.app.other_asgi_app.post('/index')
def index_post():
    return {"status": "OK"}


@app_manager.app.other_asgi_app.get("/add")
async def add_get(request: Request):
    data = dict(await request.json())
    usercode = data.get("code")
    username = data.get("name")
    userid = data.get('id')
    app_manager.users.add(PlayerData(usercode, username, userid))
    return app_manager.users.to_dict(usercode)


@app_manager.app.other_asgi_app.post("/add")
async def add_post(request: Request):
    data = dict(await request.json())
    usercode = data.get("code")
    username = data.get("name")
    userid = data.get('id')
    app_manager.users.add(PlayerData(usercode, username, userid))
    return app_manager.users.to_dict(usercode)


@app_manager.app.other_asgi_app.get("/make")
async def make_get(request: Request):
    data = dict(await request.json())
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
        return board_data(code=gamecode)
    app_manager.games[gamecode].logins += 1
    if (player.code not in app_manager.games[gamecode].users.players):
        app_manager.games[gamecode].users.add(player)
    await app_manager.socket_manager.emit("select", board_data(data.get('code')),
                                          namespace='/', broadcast=True)
    return board_data(code=gamecode, usercode=data.get("usercode"))


@app_manager.app.other_asgi_app.post("/make")
async def make(request: Request):
    data = dict(await request.json())
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
        return board_data(code=gamecode)
    app_manager.games[gamecode].logins += 1
    if (player.code not in app_manager.games[gamecode].users.players):
        app_manager.games[gamecode].users.add(player)
    await app_manager.socket_manager.emit("select", board_data(data.get('code')),
                                          namespace='/', broadcast=True)
    return board_data(code=gamecode, usercode=data.get("usercode"))


def board_data(code, usercode=None):
    game = app_manager.games[code].game
    return {
        "board": str(game.main_board),
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


@app_manager.app.other_asgi_app.get("/board")
async def board_get(request: Request):
    data = dict(await request.json())
    code = data.get('code')
    usercode = data.get('usercode')
    return board_data(code=code, usercode=usercode)


@app_manager.app.other_asgi_app.post("/board")
async def board_post(request: Request):
    data = dict(await request.json())
    code = data.get('code')
    usercode = data.get('usercode')
    return board_data(code=code, usercode=usercode)


@app_manager.app.other_asgi_app.get("/select")
async def select_get(request: Request):
    data = dict(await request.json())
    game = app_manager.games[data.get('code')].game

    if (game is None):
        return
    tile = data.get('tile')
    choice = data.get('choice')
    tup = (int(tile[1]) - 1, ord(tile[0])-97)
    game.select_tile(tup[0], tup[1], choice=choice)

    if (not (game.is_piece_selected)):
        await app_manager.socket_manager.emit("select", board_data(data.get('code')),
                                              namespace='/', broadcast=True)
    return "selected"


@app_manager.app.other_asgi_app.post("/select")
async def select_post(request: Request):
    data = dict(await request.json())
    game = app_manager.games[data.get('code')].game

    if (game is None):
        return
    tile = data.get('tile')
    choice = data.get('choice')
    tup = (int(tile[1]) - 1, ord(tile[0])-97)
    game.select_tile(tup[0], tup[1], choice=choice)

    if (not (game.is_piece_selected)):
        await app_manager.socket_manager.emit("select", board_data(data.get('code')),
                                              namespace='/', broadcast=True)
    return "selected"


@app_manager.app.other_asgi_app.get("/reset")
async def reset_get(request: Request):
    data = dict(await request.json())
    game = app_manager.games[data.get('code')].game
    app_manager.games[data.get('code')] = GameData(
        type(game)(), 0, app_manager.games[data.get('code')].users)
    return board_data(code=data.get('code'))


@app_manager.app.other_asgi_app.post("/reset")
async def reset_post(request: Request):
    data = dict(await request.json())
    game = app_manager.games[data.get('code')].game
    app_manager.games[data.get('code')] = GameData(
        type(game)(), 0, app_manager.games[data.get('code')].users)
    return board_data(code=data.get('code'))


@app_manager.app.other_asgi_app.get("/logout")
async def logout_get(request: Request):
    data = dict(await request.json())
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
    return board_data(code=data.get('code'))


@app_manager.app.other_asgi_app.post("/logout")
async def logout_post(request: Request):
    data = dict(await request.json())
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
    return board_data(code=data.get('code'))


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=5000)
