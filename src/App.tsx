import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Piece } from './components/pieces/Piece';
import { Tile } from './components/tiles/Tile';
import { Board } from './components/boards/Board'

function App() {
  return (
    <div className="App">
      <Tile rank='1' file='a'>
        <Piece color='black' name='king' />
      </Tile>
      <Tile rank='1' file='b'>
        <Piece color='white' name='king' />
      </Tile>
      <Tile rank='1' file='c' children={null}/>
      <Tile rank='1' file='d' >
        <Piece color='white' name='rook' />
      </Tile>
      <Tile rank='1' file='e'>
        <Piece color='black' name='queen'/>
      </Tile>

      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edited <code>src/App.tsx</code> and saved, and this now reloads.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>

      <p>Some pieces are: <Piece name='queen' color='black' /> </p>
      <Board>The board exists</Board>
      <div/>
    </div>
  );
}

export default App;