"use client";

import React from "react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid place-content-center">{JSON.stringify(error)}</div>
  );
}
