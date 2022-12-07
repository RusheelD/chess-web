import { useEffect, useState } from "react";
import { Board } from "./components/boards/Board";
import { UserContext, userContext } from "./models";
import { Play } from "./Play";

import "./App.css";
import { DeadPieces } from "./components/dead-pieces/DeadPieces";
import { Promotion } from "./components/promotions/Promotion";
import { Start } from "./components/starts/Start";
import { End } from "./components/ends/End";
import { io } from "socket.io-client";
import { Login } from "./components/logins/Login";
const socket = io("http://127.0.0.1:5000", { transports: ["websocket"] });

function Game() {
  const [currentPlayer, setCurrentPlayer] = useState(
    userContext.gameContext?.playerToPlay
  );
  const [board, setBoard] = useState(
    userContext.gameContext ? userContext.gameContext.board : null
  );
  const [promotion, setPromotion] = useState(
    userContext.gameContext ? userContext.gameContext.board.promotion : null
  );
  const [resetKey, setResetKey] = useState(false);
  const [logoutKey, setLogoutKey] = useState(false);

  useEffect(() => {
    function updateCurrentPlayer() {
      setCurrentPlayer(userContext.gameContext?.playerToPlay);
    }

    if (userContext.gameClient) {
      userContext.gameClient.setPlayerTurnChangeHandler(updateCurrentPlayer);
    }
  });

  useEffect(() => {
    socket.on("select", (board: any) => {
      if (!board.selected) {
        userContext.gameClient?.loadClient(board);
        console.log("got");
      }
    });
  }, []);

  useEffect(() => {
    function updateBoard() {
      setBoard(userContext.gameContext ? userContext.gameContext.board : null);
    }

    if (userContext.gameClient) {
      userContext.gameClient.setBoardUpdateHandler(updateBoard);
    }
  });

  useEffect(() => {
    function updatePromotion() {
      setPromotion(
        userContext.gameContext ? userContext.gameContext.board.promotion : null
      );
    }

    if (userContext.gameClient) {
      userContext.gameClient.setPromotionChangeHandler(updatePromotion);
    }
  });

  return (
    <div className="App">
      <div className="App-header">
        {userContext.user.name + " (" + userContext.user.id + ")"}
      </div>
      <div>
        Next player to play: {currentPlayer?.user?.name} <br />
        Color: {currentPlayer?.colorChosen}
      </div>
      <div>
        <div>
          <button onClick={() => onReset(resetKey, setResetKey, userContext)}>
            Reset
          </button>
        </div>
        <div>
          <button
            onClick={() => onLogout(logoutKey, setLogoutKey, userContext)}
          >
            Logout
          </button>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          width: "calc(var(--piece-scale)*var(--piece-width)*11.15)",
          textAlign: "center",
          display: "inline-block",
        }}
      >
        {userContext.enableTestMode ? <Play /> : null}
        {userContext.gameContext && board ? (
          <Board
            {...board}
            resetKey={resetKey}
            gameClient={userContext.gameClient}
            onSelectTile={userContext.gameClient!.handleSelectTile.bind(
              userContext.gameClient!
            )}
          />
        ) : undefined}
        {promotion ? (
          <Promotion
            {...promotion}
            onSelectPromotion={userContext.gameClient!.handleSelectPromotion.bind(
              userContext.gameClient!
            )}
          />
        ) : undefined}
      </div>
      <div>
        {board ? <DeadPieces {...board.deadWhite} /> : undefined}
        {board ? <DeadPieces {...board.deadBlack} /> : undefined}
      </div>
    </div>
  );
}

function App() {
  let [logged, setLogged] = useState(userContext.user.isLogged);
  let [started, setStarted] = useState(
    userContext.gameContext ? userContext.gameContext.game.isStarted : false
  );
  let [ended, setEnded] = useState(
    userContext.gameContext ? userContext.gameContext.game.isOver : false
  );

  useEffect(() => {
    function setGameStartedState() {
      setStarted(userContext.gameContext!.game.isStarted);
    }

    if (userContext.gameClient) {
      userContext.gameClient.setGameStartedHandler(setGameStartedState);
    }
  });

  useEffect(() => {
    function setGameEndedState() {
      setEnded(userContext.gameContext!.game.isOver);
    }

    if (userContext.gameClient) {
      userContext.gameClient.setGameEndedHandler(setGameEndedState);
    }
  });

  useEffect(() => {
    function setLoggedState() {
      setLogged(userContext.user.isLogged);
    }

    if (userContext.gameClient) {
      userContext.gameClient.setLoggedHandler(setLoggedState);
    }
  });

  return logged ? (
    started ? (
      ended ? (
        <End context={userContext} />
      ) : (
        <Game />
      )
    ) : (
      <Start context={userContext} updateStart={setStarted} />
    )
  ) : (
    <Login context={userContext} updateLogged={setLogged} />
  );
}

async function onReset(
  resetKey: boolean,
  resetHandler: (x: boolean) => void,
  userContext: UserContext
) {
  await userContext.gameClient?.reset();
  resetHandler(!resetKey);
}

async function onLogout(
  logoutKey: boolean,
  logoutHandler: (x: boolean) => void,
  userContext: UserContext
) {
  await userContext.gameClient?.logout();
  logoutHandler(!logoutKey);
}

export default App;
