import { redirect } from "next/navigation";
import React from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  redirect(`/${(await params).lang}/dashboard/teacher`);

  return <div className="grid place-content-center"></div>;
}
