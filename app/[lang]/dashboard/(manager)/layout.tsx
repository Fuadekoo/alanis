import UserLayout from "@/components/layout/userLayout";
import {
  BadgeDollarSignIcon,
  Calendar,
  Megaphone,
  MessageCircle,
  User,
  Users,
  Database,
  DollarSign,
  Receipt,
  Video,
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
        oromo: "To'ataa",
        url: "controller",
        Icon: <User className="size-5" />,
      },
      {
        english: "teacher",
        amharic: "መምህር",
        oromo: "Barsiisaa",
        url: "teacher",
        Icon: <User className="size-5" />,
      },
      {
        english: "student",
        amharic: "ተማሪ",
        oromo: "Barattoo",
        url: "student",
        Icon: <Users className="size-5" />,
      },
      {
        english: "new student",
        amharic: "አዲስ ተማሪ",
        oromo: "Barattoo Haaraa",
        url: "new-student",
        Icon: <Users className="size-5" />,
      },
      {
        english: "deposit",
        amharic: "ተቀማጭ",
        oromo: "Kuusaa",
        url: "deposit",
        Icon: <BadgeDollarSignIcon className="size-6" />, // You can replace with a more suitable icon if needed
      },
      {
        english: "payment",
        amharic: "ክፍያ",
        oromo: "Kaffaltii",
        url: "payment",
        Icon: <BadgeDollarSignIcon className="size-6" />, // You can replace with a more suitable icon if needed
      },
      {
        english: "expenses",
        amharic: "ወጪ",
        oromo: "Baasii",
        url: "expenses",
        Icon: <Receipt className="size-5" />,
      },
      {
        english: "chat",
        amharic: "ቻት",
        oromo: "Chaatii",
        url: "chat",
        Icon: <MessageCircle className="size-5" />,
      },
      {
        english: "attendances",
        amharic: "አቴንዳንስ",
        oromo: "Argama",
        url: "attendances",
        Icon: <Calendar className="size-5" />,
      },
    ],
    [
      {
        english: "daily report",
        amharic: "ረፖርት",
        oromo: "Gabaasa Guyyaa",
        url: "dailyReportView",
        Icon: <Database className="size-5" />,
      },
      {
        english: "teacher Salary",
        amharic: "teacher Salary",
        oromo: "Mindaa Barsiisaa",
        url: "teacherSalary",
        Icon: <DollarSign className="size-5" />,
      },
      {
        english: "announcement",
        amharic: "ማስታወቂያ",
        oromo: "Beeksisa",
        url: "announcement",
        Icon: <Megaphone className="size-5" />,
      },
      {
        english: "teacher announcement",
        amharic: "የመምህር ማስታወቂያ",
        oromo: "Beeksisa Barsiisaa",
        url: "teacherAnnouncement",
        Icon: <Megaphone className="size-5" />,
      },
      {
        english: "study room",
        amharic: "የመማሪያ ክፍል",
        oromo: "Kutaa Qorannoo",
        url: "studyRoom",
        Icon: <Video className="size-5" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
