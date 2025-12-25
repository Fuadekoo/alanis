import UserLayout from "@/components/layout/userLayout";
import { Home, Video } from "lucide-react";
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
        english: "Deposit",
        amharic: "የከፈሉት ደረሰኝ",
        oromo: "Kuusaa",
        url: "deposit",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Payment",
        amharic: "የከፈሉት ወር  ዝርዝር",
        oromo: "Kaffaltii",
        url: "payment",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Report",
        amharic: "ሪፖርት",
        oromo: "Gabaasa",
        url: "report",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Chat",
        amharic: "ቻት",
        oromo: "Chaatii",
        url: "chat",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Study Room",
        amharic: "የጥናት ክፍል",
        oromo: "Kutaa Qorannoo",
        url: "studyRoom",
        Icon: <Video className="size-4" />,
      },
    ],
  ];

  // Add balance display (static for now, e.g. 100 ETB)
  return <UserLayout menu={menu}>{children}</UserLayout>;
}
