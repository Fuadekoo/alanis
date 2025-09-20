import React from "react";
import { Provider } from "./provider";
import List from "./list";

export default function Page() {
  return (
    <Provider>
      <List />
    </Provider>
  );
}
