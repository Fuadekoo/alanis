import UserLayout from "@/components/layout/userLayout";
import { Home } from "lucide-react";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const menu = [
    [
      {
        english: "Room",
        amharic: "ክፍል",
        oromo: "Kutaa",
        url: "",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Daily Report",
        amharic: "የቀንስ መረጃ",
        oromo: "Gabaasa Guyyaa",
        url: "dailyReport",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Salary",
        amharic: "የመምህር ክፍያ",
        oromo: "Mindaa",
        url: "salary",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Chat",
        amharic: "ቻት",
        oromo: "Chaatii",
        url: "chat",
        Icon: <Home className="size-4" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
