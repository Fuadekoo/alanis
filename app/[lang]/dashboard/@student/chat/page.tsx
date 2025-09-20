import React from "react";
import { Chat } from "./chat";
import { List } from "./list";
import { Provider } from "./provider";

export default function Page() {
  return (
    <Provider>
      <div className="relative p-2 md:p-5 grid md:gap-5 grid-cols-[1fr_auto] overflow-hidden ">
        <Chat />
        <List />
      </div>
    </Provider>
  );
}
