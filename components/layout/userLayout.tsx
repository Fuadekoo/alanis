"use client";

import React from "react";
import SideBar from "./sidebar";
import Header from "./header";
import Image from "next/image";

export default function UserLayout({
  children,
  menu,
}: {
  children: React.ReactNode;
  menu: {
    english: string;
    amharic: string;
    oromo: string;
    url: string;
    Icon: React.JSX.Element;
  }[][];
}) {
  return (
    <div className="relative h-dvh overflow-hidden bg-gradient-to-br from-primary-200 to-secondary-200 grid ">
      <div className="z-0 fixed inset-0 grid place-content-center pointer-events-none">
        <Image
          alt=""
          src={"/al-anis.png"}
          width={1000}
          height={1000}
          className="size-60 md:size-96 opacity-20"
        />
      </div>
      <div className="z-10 h-dvh overflow-hidden grid lg:grid-cols-[auto_1fr]">
        <input type="checkbox" id="sidebar" className="hidden peer/sidebar" />
        <SideBar {...{ menu }} />
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          <Header />
          <article className="p-4 md:p-6 overflow-y-auto">{children}</article>
        </div>
      </div>
    </div>
  );
}
