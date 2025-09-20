import React from "react";
import { Provider } from "./provider";
import List from "./list";
import Detail from "./detail";
import Registration from "./registration";
import Deletion from "./deletion";

export default function Page() {
  return (
    <Provider>
      <div className="p-2 lg:p-5 grid md:grid-cols-[1fr_auto] gap-5 overflow-hidden">
        <List />
        <Detail />
        <Registration />
        <Deletion />
      </div>
    </Provider>
  );
}
