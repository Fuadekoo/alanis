import UserLayout from "@/components/layout/userLayout";
import { Calendar, MessageCircle, User, Users } from "lucide-react";
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
        english: "chat",
        amharic: "ቻት",
        url: "chat",
        Icon: <MessageCircle className="size-6" />,
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
