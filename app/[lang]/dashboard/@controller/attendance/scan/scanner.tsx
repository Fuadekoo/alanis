"use client";

import { registerAttendance } from "@/actions/controller/attendance";
import useMutation from "@/hooks/useMutation";
import { addToast } from "@heroui/react";
import { Html5Qrcode } from "html5-qrcode";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

export default function Scanner({
  setIsLoading,
}: {
  setIsLoading: (value: boolean) => void;
}) {
  const { lang } = useParams<{ lang: string }>();
  const router = useRouter();
  const [html5Qrcode, setHtml5Qrcode] = useState<Html5Qrcode>();
  const handleClose = useCallback(async () => {
    if (html5Qrcode?.isScanning) {
      html5Qrcode.stop().then(() => {
        html5Qrcode.clear();
        // Manually stop all video tracks as a fallback
        const video = document.querySelector(
          "#scanner-container video"
        ) as HTMLVideoElement | null;
        if (video && video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
      });
    }
  }, [html5Qrcode]);
  const [action, isLoading] = useMutation(registerAttendance, (state) => {
    if (state.status) {
      handleClose().then(() => {
        addToast({
          title: "Success",
          description: state.message ?? "attendance successfully taken",
          color: "success",
        });
        router.push(`/${lang}/dashboard/attendance`);
      });
    } else {
      html5Qrcode?.resume();
      addToast({
        title: "Error",
        description: state.message ?? "something were wrong",
        color: "danger",
        timeout: 1000,
      });
    }
  });

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode("scanner-container");
    setHtml5Qrcode(html5Qrcode);
    html5Qrcode.start(
      { facingMode: "environment" },
      {
        fps: 5,
        aspectRatio: window.innerHeight / window.innerWidth,
        disableFlip: false,
      },
      (value) => {
        if (!isLoading) {
          // html5Qrcode.pause();
          action(value);
        }
      },
      () => {}
    );
    return () => {
      handleClose();
    };
  }, []);

  return <div id="scanner-container" className="z-10"></div>;
}
