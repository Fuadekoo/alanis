import UserLayout from "@/components/layout/userLayout";
import { Home } from "lucide-react";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const menu = [
    [
      {
        english: "Room",
        amharic: "ክፍል",
        url: "",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Chat",
        amharic: "ቻት",
        url: "chat",
        Icon: <Home className="size-4" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
