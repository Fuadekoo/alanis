import UserLayout from "@/components/layout/userLayout";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Shuffle,
  FileText,
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
        oromo: "Ilaalcha Waliigala",
        url: "",
        Icon: <LayoutDashboard className="size-6" />,
      },
      {
        english: "teacher progress",
        amharic: "የመምህር እድገት",
        oromo: "Guddina Barsiisaa",
        url: "teacherProgress",
        Icon: <BarChart3 className="size-6" />,
      },
      {
        english: "shift data",
        amharic: "የቀይር መረጃ",
        oromo: "Deetaa Jijjiirraa",
        url: "shiftData",
        Icon: <Shuffle className="size-6" />,
      },
      {
        english: "daily report",
        amharic: "ዕለታዊ ሪፖርት",
        oromo: "Gabaasa Guyyaa",
        url: "dailyReport",
        Icon: <ClipboardList className="size-6" />,
      },
      {
        english: "teacher report",
        amharic: "የመምህር ሪፖርት",
        oromo: "Gabaasa Barsiisaa",
        url: "teacherReport",
        Icon: <FileText className="size-6" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
