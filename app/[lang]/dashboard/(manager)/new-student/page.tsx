import React from "react";
import { Provider } from "./provider";
import List from "./list";
import Deletion from "./deletion";
import Approved from "./approved";

export default function Page() {
  return (
    <Provider>
      <div className="p-2 lg:p-5 grid md:grid-cols-[1fr_auto]- gap-10 overflow-hidden ">
        <List />
        <Approved />
        <Deletion />
      </div>
    </Provider>
  );
}
