import UserLayout from "@/components/layout/userLayout";
import { Home, Video } from "lucide-react";
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
        amharic: "የከፈሉት ደረሰኝ",
        url: "deposit",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Payment",
        amharic: "የከፈሉት ወር  ዝርዝር",
        url: "payment",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Report",
        amharic: "ሪፖርት",
        url: "report",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Chat",
        amharic: "ቻት",
        url: "chat",
        Icon: <Home className="size-4" />,
      },
      {
        english: "Study Room",
        amharic: "የመማሪያ ክፍል",
        url: "studyRoom",
        Icon: <Video className="size-4" />,
      },
    ],
  ];

  // Add balance display (static for now, e.g. 100 ETB)
  return <UserLayout menu={menu}>{children}</UserLayout>;
}
