"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@/components/ui/heroui";
import {
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  AlertTriangle,
} from "lucide-react";

type AlertType = "success" | "error" | "warning" | "info";

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  error: {
    icon: XCircle,
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  info: {
    icon: Info,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
};

export default function CustomAlert({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  showCancel = false,
}: CustomAlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border-2`}
            >
              <Icon className={`size-6 ${config.color}`} />
            </div>
            <h3 className="text-lg font-bold">
              {title ||
                (type === "success"
                  ? "Success"
                  : type === "error"
                  ? "Error"
                  : type === "warning"
                  ? "Warning"
                  : "Information")}
            </h3>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-default-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </ModalBody>
        <ModalFooter>
          {showCancel && (
            <Button variant="light" onPress={onClose}>
              {cancelText}
            </Button>
          )}
          <Button
            color={
              type === "success"
                ? "success"
                : type === "error"
                ? "danger"
                : type === "warning"
                ? "warning"
                : "primary"
            }
            onPress={handleConfirm}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
