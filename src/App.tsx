import { useEffect, useState } from 'react';
import './App.css';
import { Board } from './components/boards/Board'
import { userContext } from './models';
import { Play } from './Play';

function App() {
  const [board, setBoard] = useState(userContext.gameContext ? userContext.gameContext.board : null);

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
