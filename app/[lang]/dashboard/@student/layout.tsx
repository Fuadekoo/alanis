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
        english: "Deposit",
        amharic: "መቀላቀል",
        url: "deposit",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Payment",
        amharic: "ክፍያ",
        url: "payment",
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

  // Add balance display (static for now, e.g. 100 ETB)
  return <UserLayout menu={menu}>{children}</UserLayout>;
}
