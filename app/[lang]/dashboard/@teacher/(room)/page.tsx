import React from "react";
import { Provider } from "./provider";
import List from "./list";
import UploadLink from "./uploadLink";

export default function Page() {
  return (
    <Provider>
      <List />
      <UploadLink />
    </Provider>
  );
}
