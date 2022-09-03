// Tests the controls in play mode to see how they work ...

import "./Play.css";
import { Piece } from "./components/pieces/Piece";
import { Tile } from "./components/tiles/Tile";

export function Play() {
  return (
    <div>
      <div>
        <div className="piece-holder">
          <Piece name="queen" color="black" moveCount={0} isDead={false} />
        </div>
        <div className="piece-holder big-piece">
          <Piece name="queen" color="black" moveCount={0} isDead={false} />
        </div>
        <div className="piece-holder small-piece">
          <Piece name="queen" color="black" moveCount={0} isDead={false} />
        </div>
      </div>
      <div style={{ height: "20px" }} />

      <Tile
        rank="1"
        file="a"
        piece={{ color: "black", name: "king", moveCount: 0, isDead: false }}
        isSelected={false}
        isRecentlyMoved={false}
        isPossibleMove={false}
        isCheck={false}
        isCheckmate={false}
        isStalemate={false}
        onSelect={() => {
          console.log("Clicked a tile!!");
        }}
      />

      {/* <header className="App-header">
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
            </header> */}

      <p>
        Some pieces are:{" "}
        <Piece name="queen" color="black" moveCount={0} isDead={false} />{" "}
      </p>
      <div>Test mode ends here and the actual app starts here</div>
      <hr />
    </div>
  );
}
