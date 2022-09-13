import { EndInfo } from "../../models";

export function End(props: EndInfo) {
  let color = "";
  if (props.context.gameContext!.board.inCheck) {
    color =
      props.context.gameContext!.board.inCheck.piece!.color === "white"
        ? "black"
        : "white";
  }

  async function reset() {
    await props.context.gameClient!.logout();
    props.context.gameClient!.updateGameOver();
    props.context.gameClient!.updateGameStarted();
    props.context.gameClient!.updateLogged();
  }

  return color === "" ? (
    <div>
      <h1>
        <p>Stalemate</p>
      </h1>
      <p>Tie!</p>
      <button onClick={() => reset()}>Play Again?</button>
    </div>
  ) : (
    <div>
      <h1>
        <p>Checkmate</p>
      </h1>
      <p>{color.toUpperCase()} WINS!</p>
      <button onClick={() => reset()}>Play Again?</button>
    </div>
  );
}
