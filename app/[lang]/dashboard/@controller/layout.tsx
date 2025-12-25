import UserLayout from "@/components/layout/userLayout";
import {
  BadgeDollarSignIcon,
  Calendar,
  MessageCircle,
  User,
  Users,
  CreditCard,
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
        english: "teacher",
        amharic: "መምህር",
        oromo: "Barsiisaa",
        url: "teacher",
        Icon: <User className="size-6" />,
      },
      {
        english: "student",
        amharic: "ተማሪ",
        oromo: "Barattoo",
        url: "student",
        Icon: <Users className="size-6" />,
      },
      {
        english: "new student",
        amharic: "አዲስ ተማሪ",
        oromo: "Barattoo Haaraa",
        url: "new-student",
        Icon: <Users className="size-6" />,
      },
      {
        english: "deposit",
        amharic: "ተቀማጭ",
        oromo: "Kuusaa",
        url: "deposit",
        Icon: <BadgeDollarSignIcon className="size-6" />,
      },
      {
        english: "payment",
        amharic: "ክፍያ",
        oromo: "Kaffaltii",
        url: "payment",
        Icon: <CreditCard className="size-6" />,
      },
      {
        english: "chat",
        amharic: "ቻት",
        oromo: "Chaatii",
        url: "chat",
        Icon: <MessageCircle className="size-6" />,
      },
      {
        english: "daily report",
        amharic: "የቀንበሩ መመሪያ",
        oromo: "Gabaasa Guyyaa",
        url: "dailyReport",
        Icon: <Calendar className="size-6" />,
      },
      {
        english: "attendance",
        amharic: "አቴንዳንስ",
        oromo: "Argama",
        url: "attendance",
        Icon: <Calendar className="size-6" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
