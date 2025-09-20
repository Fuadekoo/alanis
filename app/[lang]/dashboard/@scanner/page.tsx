"use client";

import { logout } from "@/actions/common/auth";
import { getAttendanceToken } from "@/actions/scanner/attendance";
import Theme from "@/components/layout/theme";
import { Button, Skeleton } from "@/components/ui/heroui";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import React, { useEffect } from "react";
import { QRCode } from "react-qrcode-logo";

export default function Page() {
  const [data, , refresh] = useData(getAttendanceToken, () => {});

  useEffect(() => {
    const func = setInterval(refresh, 5000);
    return () => {
      clearInterval(func);
    };
  }, []);

  return (
    <div className="relative grid ">
      <Header />
      <div
        onDoubleClick={({ currentTarget }) => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (document.fullscreenEnabled) {
            currentTarget.requestFullscreen();
          }
        }}
        className="pt-16 grid place-content-center"
      >
        {!data ? (
          <Skeleton
            style={{
              width:
                window.innerWidth > 450 && window.innerHeight > 450 ? 450 : 250,
              height:
                window.innerWidth > 450 && window.innerHeight > 450 ? 450 : 250,
            }}
            className="border border-default-200 "
          />
        ) : (
          <QRCode
            value={data}
            size={
              window.innerWidth > 450 && window.innerHeight > 450 ? 450 : 250
            }
            quietZone={10}
            style={{ borderRadius: 30 }}
            bgColor={"#FFFFFFFA"}
            fgColor={"#000"}
            ecLevel="L"
            logoImage="/al-anis.png"
            logoHeight={64}
            logoWidth={64}
            logoPadding={5}
            logoPaddingStyle="circle"
            removeQrCodeBehindLogo={true}
            enableCORS={true}
            qrStyle="dots"
            eyeColor={{ outer: "#0DA194", inner: "#F29421" }}
            eyeRadius={[
              [20, 0, 20, 0],
              [0, 20, 0, 20],
              [0, 20, 0, 20],
            ]}
          />
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 h-16 p-2 md:pr-10 bg-default-50/30 shadow shadow-primary/30 flex gap-5 items-center ">
      <div className=""></div>
      <div className="flex-1"></div>
      <Theme />
      <Logout />
    </header>
  );
}

function Logout() {
  const [action, isLoading] = useMutation(logout);

  return (
    <div className="flex ">
      <Button
        variant="flat"
        color="danger"
        onPress={action}
        isLoading={isLoading}
      >
        Logout
      </Button>
    </div>
  );
}
