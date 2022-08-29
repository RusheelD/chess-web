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
    def updateLogout(self):
        self.can_logout = not(self.can_logout)

# Initialize the app manager
app_manager = AppManager(app)

@app_manager.app.route('/')
def i():
    return flask.redirect(flask.url_for('index'))

# Route to index page, 
@app_manager.app.route("/index", methods=['GET', 'POST'])
def index():
    if(flask.request.method == 'GET'):
        data = app_manager.updated_data
        gamemode = ""
        if(data!=None):
            chosen = str(data.keys())[2:-2]
            gamemode = data.to_dict()[chosen]
        return flask.render_template('index.html', gamemode=gamemode)
    app_manager.updated_data = flask.request.values
    return flask.redirect(flask.url_for('redirect'))
       
@app_manager.app.route("/redirect")
def redirect():
    req=app_manager.updated_data.to_dict()
    open('output.txt', 'w', encoding='utf-8').write(str(req))
    flask.request.method = 'GET'
    return flask.redirect(flask.url_for('index'))

@app_manager.app.route("/game")
def game():
    game = GameControl()
    return {"board":game.main_board.to_fen()}

@app_manager.app.route("/synchronic")
def synchronic():
    pass

@app_manager.app.route("/singleplayer")
def ai():
    pass

@app_manager.app.route("/twoplayer")
def classic():
    pass

# Function to simplify making an html tag
def makeTag(tag, *content, metadata=""):
    if content == None:
        return "<"+tag+" "+metadata+"/>"
    return "<"+tag+" "+metadata+">"+mergeTags(*content)+"</"+tag+">"

# Function to simplify making an html page
def makePage(metadata, *tags):
    head = makeTag("head", metadata)
    body = makeTag("body", *tags)
    html = makeTag("html", head, body)
    return  "<!doctype html>\n"+html

# Function to merge an undetermined number of html tags
def mergeTags(*tags):
    content = ""
    for tag in tags:
        content += tag + "\n"
    return content

app.run()
