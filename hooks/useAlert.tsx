"use client";

import { useState } from "react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

export default function useAlert() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    message: "",
    type: "info",
  });

  const showAlert = (options: AlertOptions | string) => {
    if (typeof options === "string") {
      setAlertOptions({
        message: options,
        type: "info",
      });
    } else {
      setAlertOptions(options);
    }
    setIsOpen(true);
  };

  const closeAlert = () => {
    setIsOpen(false);
  };

  return {
    isAlertOpen: isOpen,
    alertOptions,
    showAlert,
    closeAlert,
  };
}
