import React from "react";
import { Provider } from "./provider";
import { List } from "./list";
import { Detail } from "./detail";

export default function page() {
  return (
    <Provider>
      <div className="grid md:grid-cols-2 gap-5 overflow-hidden ">
        <List />
        <Detail />
      </div>
    </Provider>
  );
}

{
  /* <div className="size-fit p-2 border rounded-xl grid gap-1 grid-cols-7 ">
    {["S", "M", "T", "W", "T", "F", "S"].map((v, i) => (
      <div key={i + ""} className="size-10 content-center text-center ">
        {v}
      </div>
    ))}
    {Array(2)
      .fill({})
      .map(({}, i) => (
        <div
          key={i + ""}
          className="size-10 bg-default-400 rounded-xl content-center text-center opacity-20 "
        >
          {i + 1}
        </div>
      ))}
    {Array(30)
      .fill({})
      .map(({}, i) => (
        <div
          key={i + ""}
          className="size-10 bg-default-400 rounded-xl content-center text-center"
        >
          {i + 1}
        </div>
      ))}
    {Array(3)
      .fill({})
      .map(({}, i) => (
        <div
          key={i + ""}
          className="size-10 bg-default-400 rounded-xl content-center text-center opacity-20 "
        >
          {i + 1}
        </div>
      ))}
  </div> */
}
