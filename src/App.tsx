import { useEffect, useState } from "react";
import { Board } from "./components/boards/Board";
import { UserContext, userContext } from "./models";
import { Play } from "./Play";

import "./App.css";
import { DeadPieces } from "./components/dead-pieces/DeadPieces";

function App() {
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

async function onReset(
  resetKey: boolean,
  resetHandler: (x: boolean) => void,
  userContext: UserContext
) {
  await userContext.gameClient?.reset();
  resetHandler(!resetKey);
}

export default App;
