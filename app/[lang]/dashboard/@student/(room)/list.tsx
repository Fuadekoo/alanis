"use client";

import {
  Button,
  Skeleton,
} from "@/components/ui/heroui";
import { Spinner } from "@heroui/react";
import React, { useState } from "react";
import { useRoom } from "./provider";
import { timeFormat12 } from "@/lib/utils";
import { useParams } from "next/navigation";
import { RefreshCcw, CheckCircle2, ArrowRightCircle } from "lucide-react";
import Image from "next/image";
import { Announcement } from "./announcement";
import { registerRoomAttendance, verifyRoomAttendance } from "@/actions/student/room";
import { addToast } from "@heroui/react";

type RoomData = {
  id: string;
  time: string;
  teacher: {
    firstName: string;
    fatherName: string;
    lastName: string;
    gender: string;
  };
  link: string;
};

function RoomItem({ room, index, lang }: { room: RoomData; index: number; lang: string }) {
  const [step, setStep] = useState<"idle" | "checking" | "saving" | "verifying" | "done">("checking");
  const { id, time, teacher, link } = room;

  React.useEffect(() => {
    async function checkStatus() {
      const verification = await verifyRoomAttendance(id);
      if (verification.status) {
        setStep("done");
      } else {
        setStep("idle");
      }
    }
    checkStatus();
  }, [id]);

  const handleAttendance = async () => {
    setStep("saving");
    const res = await registerRoomAttendance(id);
    if (!res.status) {
      addToast({
        title: "Error",
        description: res.message || "Failed to save attendance",
        color: "danger",
      });
      setStep("idle");
      return;
    }

    setStep("verifying");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStep("done");
  };

  const handleJoin = async () => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-4 border border-primary/20 bg-default-50/30 backdrop-blur-md rounded-2xl grid gap-4 transition-all hover:border-primary/50 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="font-black text-4xl text-primary drop-shadow-sm">
          {timeFormat12(time)}
        </div>
        <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-bold text-primary italic">
          #{index + 1}
        </div>
      </div>

      <div className="text-lg font-medium capitalize text-default-700">
        {teacher.gender === "Female"
          ? lang === "am"
            ? "ኡስታዛ"
            : lang === "or"
            ? "Ustazah"
            : "Ustazah"
          : lang === "am"
          ? "ኡስታዝ"
          : lang === "or"
          ? "Ustaz"
          : "Ustaz"}{" "}
        {teacher.firstName} {teacher.fatherName}
      </div>

      <div className="mt-2">
        {!link ? (
          <div className="w-full p-4 border-2 border-dashed border-default-200 rounded-xl text-center text-default-400 font-medium">
            {lang === "am" ? "ሊንክ አልተላከም" : lang === "or" ? "Linki hin ergamne" : "Link not sent yet"}
          </div>
        ) : (
          <div className="grid gap-2">
            {step === "checking" && (
              <Button
                size="lg"
                isDisabled
                className="h-16 text-lg font-bold bg-default-100 text-default-400 transition-all"
                startContent={<Spinner size="sm" color="default" />}
              >
                {lang === "am" ? "በማጣራት ላይ..." : lang === "or" ? "Qulqulleessaa jira..." : "Checking..."}
              </Button>
            )}

            {step === "idle" && (
              <Button
                size="lg"
                color="primary"
                className="h-16 text-lg font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                onPress={handleAttendance}
                startContent={<CheckCircle2 className="size-6" />}
              >
                {lang === "am" 
                  ? "አሁን ይግቡ (መገኘት ይመዝገብ)" 
                  : lang === "or" 
                  ? "Amma Seenaa (Hirmaannaa galmeessi)" 
                  : "Join Now (Register Attendance)"}
              </Button>
            )}

            {step === "saving" && (
              <Button
                size="lg"
                isDisabled
                className="h-16 text-lg font-bold bg-warning-100 text-warning-700 animate-pulse"
                startContent={<Spinner size="sm" color="warning" />}
              >
                {lang === "am" ? "በመመዝገብ ላይ..." : lang === "or" ? "Galmeessaa jira..." : "Saving Attendance..."}
              </Button>
            )}

            {step === "verifying" && (
              <Button
                size="lg"
                isDisabled
                className="h-16 text-lg font-bold bg-secondary-100 text-secondary-700 animate-pulse"
                startContent={<Spinner size="sm" color="secondary" />}
              >
                {lang === "am" ? "በማረጋገጥ ላይ..." : lang === "or" ? "Mirkaneessaa jira..." : "Verifying..."}
              </Button>
            )}

            {step === "done" && (
              <Button
                size="lg"
                color="success"
                className="h-16 text-xl font-black text-success-foreground shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                onPress={handleJoin}
                startContent={<ArrowRightCircle className="size-6" />}
              >
                {lang === "am" ? "ወደ ክፍል ይግቡ" : lang === "or" ? "Gara kutaa seenaa" : "Go to Classroom"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function List() {
  const { lang } = useParams<{ lang: string }>();
  const {
    controller,
    room: { data, isLoading, refresh },
  } = useRoom();

  return (
    <div className="p-4 flex flex-col gap-6 max-w-7xl mx-auto">
      <Announcement />

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold px-1 border-l-4 border-primary ml-1">
          {lang === "am" ? "የዛሬ የትምህርት ክፍለ ጊዜ" : lang === "or" ? "Kutaa Barnootaa Har'aa" : "Today's Learning Sessions"}
        </h2>

        {isLoading || !data ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.length ? (
              data.map((room, i) => (
                <RoomItem key={room.id} room={room} index={i} lang={lang} />
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-default-300 bg-default-50 px-6 py-10 text-center text-default-500">
                {lang === "am"
                  ? "እስካሁን ምንም የዛሬ ክፍል አልተመደበልዎትም።"
                  : lang === "or"
                  ? "Ammaaf kutaan har'aa siif hin ramadamne."
                  : "No learning session has been assigned for today yet."}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <p className="text-default-700 leading-relaxed font-medium">
            {lang === "am"
              ? "መምህሩ ሊንክ የላከ መሆኑን ለማረጋገጥ ከታች ያለውን ይጫኑ። ካልመጣልዎት ትንሽ ጠብቀው በድጋሜ ይሞክሩ። ኡስታዙ ሊንክ ሳይልክ ብዙ ከቆየብዎት ለተቆጣጣሪዎች ሪፖርት ያድርጉ"
              : lang === "or"
              ? "Barsiisaan linki akka erge mirkaneessuuf armaan gadii tuqaa. Yoo hin dhufne xiqqoo eegdanii irra deebi'aa yaalaa. Ustazaan linki osoo hin ergin yeroo dheeraa yoo tureef to'atoota gabaasaa"
              : "Verify that the teacher has sent the link. If it doesn't appear, wait a moment and try again. Report to controllers if the link takes too long."}
          </p>
          <Button
            color="primary"
            variant="shadow"
            className="font-bold"
            endContent={<RefreshCcw className="size-4" />}
            onPress={refresh}
          >
            {lang === "am" ? "ያድሱ" : lang === "or" ? "Haaromsi" : "Refresh Page"}
          </Button>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center border-l-0 md:border-l border-primary/20 pl-0 md:pl-10 pt-6 md:pt-0">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Support Controller</span>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <p className="text-xl font-bold text-primary font-mono bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 shadow-inner">
              {controller?.phoneNumber || "251924232389"}
            </p>
            <div className="flex gap-4">
              <a
                href={`https://wa.me/${(controller?.phoneNumber || "251924232389").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-success-50 text-success rounded-2xl hover:bg-success-100 hover:scale-110 active:scale-95 transition-all border border-success-200 shadow-sm group"
                title="WhatsApp"
              >
                <Image alt="WhatsApp" src={"/whatsapp.svg"} width={40} height={40} className="size-8 group-hover:drop-shadow-md" />
              </a>
              <a
                href={`https://t.me/+${(controller?.phoneNumber || "251924232389").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-primary-50 text-primary rounded-2xl hover:bg-primary-100 hover:scale-110 active:scale-95 transition-all border border-primary-200 shadow-sm group"
                title="Telegram"
              >
                <Image alt="Telegram" src={"/telegram.svg"} width={40} height={40} className="size-8 group-hover:drop-shadow-md" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
