import React from "react";
import { Provider } from "./provider";
import List from "./list";
import UploadLink from "./uploadLink";

export default function Page() {
  return (
    <Provider>
      <div className="h-full min-h-0 overflow-y-auto">
        <List />
      </div>
      <UploadLink />
    </Provider>
  );
}
