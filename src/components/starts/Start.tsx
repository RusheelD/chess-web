import { useState } from "react";
import { StartInfo } from "../../models";

export function Start(props: StartInfo) {
  const [gameCode, setGameCode] = useState("");
  function onStartPass() {
    if (props.context.gameContext) {
      props.context.gameContext.game.isStarted = true;
    }
    if (props.context.gameClient) {
      window.location.href =
        window.location.protocol +
        "?code=" +
        Math.floor(Math.random() * 1000000).toString() +
        "&gamemode=Classic&playmode=pass";
      props.context.gameClient.initialize();
    }
    props.updateStart(true);
  }
  function onStartCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let gamemode = (e.nativeEvent as SubmitEvent).submitter!.id;
    if (props.context.gameContext) {
      if (gameCode !== "" && gameCode !== undefined) {
        props.context.gameContext.game.isStarted = true;
        props.context.gameContext.game.gameCode = gameCode;
        if (props.context.gameClient) {
          window.location.href =
            window.location.protocol +
            "?code=" +
            gameCode +
            "&gamemode=" +
            gamemode +
            "&playmode=network";
          props.context.gameClient.initialize();
        }
        props.updateStart(true);
      }
      console.log(gamemode);
    }
  }
  function onGameCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setGameCode(e.target.value);
  }

  if (props.context.gameContext!.game.isStarted) {
    props.updateStart(true);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>
        <p>Select Game Mode</p>
      </h1>
      <p>
        <button onClick={() => onStartPass()}>Pass & Play</button>
      </p>
      <form onSubmit={onStartCode} style={{ visibility: "visible" }}>
        <p>
          <input
            type="text"
            placeholder="Game Code"
            value={gameCode !== "" ? gameCode : undefined}
            style={{ textAlign: "center" }}
            onChange={onGameCodeChange}
          />
        </p>
        <p>
          <button type="submit" id="Classic">
            Classic Online
          </button>
        </p>
        <p>
          <button type="submit" id="Synchronic">
            Synchronic Online
          </button>
        </p>
      </form>
    </div>
  );
}
