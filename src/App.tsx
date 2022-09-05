import { useEffect, useState } from "react";
import { Board } from "./components/boards/Board";
import { /*TileInfo,*/ UserContext, userContext } from "./models";
import { Play } from "./Play";

import "./App.css";
import { DeadPieces } from "./components/dead-pieces/DeadPieces";
// import { Promotion } from "./components/promotions/Promotion";
import { Start } from "./components/starts/Start";
import { End } from "./components/ends/End";

function Game() {
  const [currentPlayer, setCurrentPlayer] = useState(
    userContext.gameContext?.playerToPlay
  );
  const [board, setBoard] = useState(
    userContext.gameContext ? userContext.gameContext.board : null
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
    function updateBoard() {
      setBoard(userContext.gameContext ? userContext.gameContext.board : null);
    }

    if (userContext.gameClient) {
      userContext.gameClient.setBoardUpdateHandler(updateBoard);
    }
  });

  /* let promotion = {
    color: "black",
    location: "i9",
    onSelectPromotion: (tile: TileInfo) => null,
  }; */

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
