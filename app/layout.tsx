import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { UIProvider } from "@/components/ui/heroui";

export const metadata: Metadata = {
  // title: "Al Anis Quran Center",
  keywords:
    "al anis, al anis quran, alanis, alanisquran, quran center, alanis quran center, ethio quran center, አልአኒስ, አል አኒስ, አልአኒስ ቁርዓን, አልአኒስ ቁርዓን ማዕከል, የቁርዓን ማዕከል, የኢትዮጲያ የቁርዓን ማዕከል",
  description: `A knowledge center that introduced many who said they could not read/recite the Quran to the entire Quran in less than two months.\n\n
    Learn the Quran with quality, complete it, and receive a certificate of completion from anywhere in the world using our modern technology application.\n\n
    Where you can learn Tajweed to recite the Quran beautifully\n\n
    We have extended an invitation to learn the word of Allah in our institution, which is filled with Hafizs and scholars, where the Quran is reserved for those who have completed the books.\n\n\n\n

    ቁርአንን ማንበብ/መቅራት አልችልም ይሉ የነበሩ ብዙዎችን ከሁለት ወር ባነሰ ጊዜ ሙሉ ቁርዓን ጋር ያስተዋወቀ የእውቀት ማዕከል\n\n
    በየትኛውም የአለማችን ክፍል ላይ ሆነው በዘመናዊ ቴክኖሎጂ መተግበሪያችን ቁርአንን በጥራት ተምረው ና አጠናቀው ተፈትነው ማረጋገጫ ሰርተፍኬት ባለቤት የሚሆኑበት\n\n
    ቁርአንን አሳምሮ የመቅራት ተጅዊድ ትምህርት የሚያገኙበት\n\n
    ቁርአንን ለጨረሱ ኪታቦች የሚቀሩበት በሀፊዞችና በ አሊሞች በተሞላው ተቋማችን የአላህን ቃል እንድማሩ ጥሪ አስተላልፈናል\n\n
    `,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`select-none  antialiased fixed inset-0 grid`}>
        <SessionProvider session={session}>
          <UIProvider>
            <div className="h-dvh bg-gradient-to-br from-primary-200 to-secondary-200 text-foreground grid overflow-hidden ">
              {children}
            </div>
          </UIProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
