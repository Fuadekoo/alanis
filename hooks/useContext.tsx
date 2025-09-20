import React, { useContext as use } from "react";

export function useContext<T>(context: React.Context<T>) {
  const value = use(context);
  if (!value) throw new Error("You need to have provide first 😉");
  return value;
}
