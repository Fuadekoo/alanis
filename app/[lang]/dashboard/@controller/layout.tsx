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
        url: "teacher",
        Icon: <User className="size-6" />,
      },
      {
        english: "student",
        amharic: "ተማሪ",
        url: "student",
        Icon: <Users className="size-6" />,
      },
      {
        english: "new student",
        amharic: "አዲስ ተማሪ",
        url: "new-student",
        Icon: <Users className="size-6" />,
      },
      {
        english: "deposit",
        amharic: "ተቀማጭ",
        url: "deposit",
        Icon: <BadgeDollarSignIcon className="size-6" />,
      },
      {
        english: "payment",
        amharic: "ክፍያ",
        url: "payment",
        Icon: <CreditCard className="size-6" />,
      },
      {
        english: "chat",
        amharic: "ቻት",
        url: "chat",
        Icon: <MessageCircle className="size-6" />,
      },
      {
        english: "daily report",
        amharic: "የቀንበሩ መመሪያ",
        url: "dailyReport",
        Icon: <Calendar className="size-6" />,
      },
      {
        english: "attendance",
        amharic: "አቴንዳንስ",
        url: "attendance",
        Icon: <Calendar className="size-6" />,
      },
    ],
  ];

  return <UserLayout menu={menu}>{children}</UserLayout>;
}
