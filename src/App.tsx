import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Piece } from './components/pieces/Piece';

function App() {
  return (
    <div className="App">
      <Piece color='black' name='king' />
      <Piece color='white' name='king' />
      <Piece color='white' name='rook' />

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
    </div>
  );
}

export default App;
