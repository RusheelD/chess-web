import { useState } from "react";
import { LoginInfo } from "../../models";
import "./Login.css";

export function Login(props: LoginInfo) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  if (props.context.user.isLogged) {
    props.updateLogged(true);
  }
  function onUserIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUserId(e.target.value);
  }
  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUserId(
      (
        (e.target as HTMLInputElement).children[0]
          .children[0] as HTMLInputElement
      ).value
    );
    setName(
      (
        (e.target as HTMLInputElement).children[1]
          .children[0] as HTMLInputElement
      ).value
    );
    if (userId !== "" && name !== "") {
      let usercode = Math.floor(Math.random() * 1000000).toString();
      props.context.user.name = name;
      props.context.user.id = userId;
      props.context.user.code = usercode;
      props.context.user.isLogged = true;
      window.location.href = window.location.protocol + "?usercode=" + usercode;
      if (props.context.gameClient) {
        props.context.gameClient.addUser();
      }
      props.updateLogged(true);
    }
  }
  return (
    <div style={{ textAlign: "center" }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <p>
          <input
            placeholder="email"
            style={{ textAlign: "center" }}
            value={userId !== "" ? userId : undefined}
            onChange={onUserIdChange}
            autoComplete="off"
          />
        </p>
        <p>
          <input
            placeholder="name"
            style={{ textAlign: "center" }}
            value={name !== "" ? name : undefined}
            onChange={onNameChange}
            autoComplete="off"
          />
        </p>
        <p>
          <button type="submit">Submit</button>
        </p>
      </form>
    </div>
  );
}
