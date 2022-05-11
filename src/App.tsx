import { useEffect, useState } from 'react';
import { Board } from './components/boards/Board'
import { GameClient, userContext } from './models';
import { Play } from './Play';

import './App.css';

function App() {
  const [currentPlayer, setCurrentPlayer] = useState(userContext.gameContext?.playerToPlay);
  const [board, setBoard] = useState(userContext.gameContext ? userContext.gameContext.board : null);

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
      <div className="App-header">{userContext.user.name + " (" + userContext.user.id + ")"}</div>
      <div>
        Next player to play: {currentPlayer?.user?.name} <br />
        Color: {currentPlayer?.colorChosen}
      </div>
      {userContext.enableTestMode ? <Play /> : null}
      {
        (userContext.gameContext && board)
         ? <Board
            {...board}
            gameClient={userContext.gameClient}
            onSelectTile ={userContext.gameClient!.selectTile.bind(userContext.gameClient!)} />
         : undefined}
    </div>
  );
}

export default App;
