import { useEffect, useState } from "react";
import { Board } from "./components/boards/Board";
import { UserContext, userContext } from "./models";
import { Play } from "./Play";

import "./App.css";
import { DeadPieces } from "./components/dead-pieces/DeadPieces";
import { Promotion } from "./components/promotions/Promotion";
import { Start } from "./components/starts/Start";
import { End } from "./components/ends/End";
import * as io from "socket.io-client";
const socket = io.connect("http://127.0.0.1:5000");

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
      userContext.gameClient?.loadClient(board);
      console.log("got");
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
        <button onClick={() => onReset(resetKey, setResetKey, userContext)}>
          Reset
        </button>
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
  let [started, setStarted] = useState(false);
  let [ended, setEnded] = useState(false);

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

  return started ? (
    ended ? (
      <End context={userContext} />
    ) : (
      <Game />
    )
  ) : (
    <Start context={userContext} updateStart={setStarted} />
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

export default App;
