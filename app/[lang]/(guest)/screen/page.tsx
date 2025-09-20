"use client";

import { Button } from "@/components/ui/heroui";
import React, { useRef } from "react";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="h-dvh grid gap-10 place-content-center">
      <Button
        color="primary"
        className="w-72"
        onPress={async () => {
          await navigator.mediaDevices
            .getDisplayMedia({
              video: true,
              audio: true,
            })
            .then((stream) => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
            })
            .catch(() => {
              alert("something were wrong!!");
            });
        }}
      >
        start
      </Button>

      <video ref={videoRef} autoPlay className="w-72 h-40 border"></video>
    </div>
  );
}
