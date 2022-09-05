import { StartInfo } from "../../models";

export function Start(props: StartInfo) {
  function onStart() {
    if (props.context.gameContext) {
      props.context.gameContext.game.isStarted = true;
    }
    props.updateStart(true);
  }
  if (props.context.gameContext!.game.isStarted) {
    props.updateStart(true);
  }
  return (
    <div>
      <h1>
        <p>Select Game Mode</p>
      </h1>
      <button onClick={() => onStart()}>Pass & Play</button>
    </div>
  );
}
