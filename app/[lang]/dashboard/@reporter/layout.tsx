import UserLayout from "@/components/layout/userLayout";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Shuffle,
} from "lucide-react";
import React from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menu = [
    [
      {
        english: "overview",
        amharic: "ማጠቃለያ",
        url: "",
        Icon: <LayoutDashboard className="size-6" />,
      },
      {
        english: "teacher progress",
        amharic: "የመምህር እድገት",
        url: "teacherProgress",
        Icon: <BarChart3 className="size-6" />,
      },
      {
        english: "shift data",
        amharic: "የቀይር መረጃ",
        url: "shiftData",
        Icon: <Shuffle className="size-6" />,
      },
      {
        english: "daily report",
        amharic: "ዕለታዊ ሪፖርት",
        url: "dailyReport",
        Icon: <ClipboardList className="size-6" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
