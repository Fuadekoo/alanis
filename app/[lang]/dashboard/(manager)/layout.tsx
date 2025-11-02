import UserLayout from "@/components/layout/userLayout";
import {
  BadgeDollarSignIcon,
  Calendar,
  Megaphone,
  MessageCircle,
  User,
  Users,
  Database,
  DollarSign
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
        english: "controller",
        amharic: "ተቆጣጣሪ",
        url: "controller",
        Icon: <User className="size-5" />,
      },
      {
        english: "teacher",
        amharic: "መምህር",
        url: "teacher",
        Icon: <User className="size-5" />,
      },
      {
        english: "student",
        amharic: "ተማሪ",
        url: "student",
        Icon: <Users className="size-5" />,
      },
      {
        english: "new student",
        amharic: "አዲስ ተማሪ",
        url: "new-student",
        Icon: <Users className="size-5" />,
      },
      {
        english: "deposit",
        amharic: "ተቀማጭ",
        url: "deposit",
        Icon: <BadgeDollarSignIcon className="size-6" />, // You can replace with a more suitable icon if needed
      },
      {
        english: "payment",
        amharic: "ክፍያ",
        url: "payment",
        Icon: <BadgeDollarSignIcon className="size-6" />, // You can replace with a more suitable icon if needed
      },
      {
        english: "chat",
        amharic: "ቻት",
        url: "chat",
        Icon: <MessageCircle className="size-5" />,
      },
      {
        english: "attendances",
        amharic: "አቴንዳንስ",
        url: "attendances",
        Icon: <Calendar className="size-5" />,
      },
    ],
    [
      {
        english: "daily report",
        amharic: "ረፖርት",
        url: "dailyReportView",
        Icon: <Database className="size-5" />,
      },
      {
        english: "teacher Salary",
        amharic: "teacher Salary",
        url: "teacherSalary",
        Icon: <DollarSign className="size-5" />,
      },
      {
        english: "announcement",
        amharic: "ማስታወቂያ",
        url: "announcement",
        Icon: <Megaphone className="size-5" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
