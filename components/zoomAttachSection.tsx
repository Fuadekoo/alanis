"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { detachZoomAccount } from "@/actions/common/zoomAttach";
import useMutation from "@/hooks/useMutation";
import { addToast } from "@heroui/react";
import { Button, Card } from "@/components/ui/heroui";

type ZoomAttachData = {
  id: string;
  zoomUserId: string;
  zoomEmail: string;
  zoomDisplayName?: string | null;
  zoomAccountType?: string | null;
};

export default function ZoomAttachSection({ data }: { data?: ZoomAttachData }) {
  const router = useRouter();

  const [handleDetach, isDetaching] = useMutation(
    detachZoomAccount,
    (state) => {
      if (state.status) {
        addToast({
          title: "Success",
          description: state.message,
          color: "success",
        });
        router.refresh();
      } else {
        addToast({
          title: "Error",
          description: state.message,
          color: "danger",
        });
      }
    },
  );

  return (
    <Card className="p-4 rounded-lg border border-default-200/70">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Zoom Account</h2>
        <p className="text-sm text-default-500">
          {data
            ? "Your connected Zoom account details (used to generate meeting links)."
            : "No Zoom account attached. Please attach your Zoom account to enable automatic link generation and delivery."}
        </p>
      </div>

      {data ? (
        <div className="space-y-1">
          <p>
            <strong>Zoom User ID:</strong> {data.zoomUserId}
          </p>
          <p>
            <strong>Zoom Email:</strong> {data.zoomEmail}
          </p>
          <p>
            <strong>Display Name:</strong> {data.zoomDisplayName || "(empty)"}
          </p>
          <p>
            <strong>Account Type:</strong> {data.zoomAccountType || "personal"}
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="flat"
              color="primary"
              onPress={() => {
                window.location.href = "/api/zoom/auth";
              }}
            >
              Reconnect
            </Button>
            <Button
              color="danger"
              isLoading={isDetaching}
              onPress={() => handleDetach()}
            >
              Detach
            </Button>
          </div>
        </div>
      ) : (
        <Button
          color="primary"
          onPress={() => {
            window.location.href = "/api/zoom/auth";
          }}
        >
          Connect Zoom Account
        </Button>
      )}
    </Card>
  );
}
