"use client";

import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { cn, HeroUIProvider, ToastProvider } from "@heroui/react";
import { Skeleton as HSkeleton, SkeletonProps } from "@heroui/skeleton";

import {
  Modal as HModal,
  ModalContent as HModalContent,
  ModalHeader as HModalHeader,
  ModalBody as HModalBody,
  ModalFooter as HModalFooter,
  ModalProps,
} from "@heroui/modal";
import {
  Card as HCard,
  CardHeader as HCardHeader,
  CardBody as HCardBody,
  CardFooter as HCardFooter,
} from "@heroui/card";
import { Button as HButton, ButtonGroup as HButtonGroup } from "@heroui/button";
import { Input as HInput, Textarea as HTextarea } from "@heroui/input";
import { Select as HSelect, SelectItem as HSelectItem } from "@heroui/select";
import { ScrollShadow as HScrollShadow } from "@heroui/scroll-shadow";
import { Pagination as HPagination } from "@heroui/pagination";
import { Link as HLink } from "@heroui/link";
import {
  Accordion as HAccordion,
  AccordionItem as HAccordionItem,
} from "@heroui/accordion";
import { Form as HForm } from "@heroui/form";
import {
  Dropdown as HDropdown,
  DropdownSection as HDropdownSection,
  DropdownMenu as HDropdownMenu,
  DropdownItem as HDropdownItem,
  DropdownTrigger as HDropdownTrigger,
} from "@heroui/dropdown";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider locale="en-US" navigate={router.push}>
      <ToastProvider toastProps={{ color: "default", variant: "flat" }} />
      <ThemeProvider enableSystem defaultTheme="system" attribute="class">
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  );
}

export function Skeleton(props: SkeletonProps) {
  return (
    <HSkeleton
      {...props}
      className={cn("rounded-xl bg-default-50/30 ", props.className)}
    />
  );
}

export function CModal(props: ModalProps) {
  return (
    <HModal
      classNames={{ wrapper: "p-5" }}
      backdrop="blur"
      placement="center"
      scrollBehavior="outside"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      enterKeyHint="done"
      {...props}
    >
      {props.children}
    </HModal>
  );
}

export * from "@heroui/date-picker";

export { Chip } from "@heroui/chip";
export const ButtonGroup = HButtonGroup;
export const Button = HButton;
export const Form = HForm;
export const Input = HInput;
export const Textarea = HTextarea;
export const Select = HSelect;
export const SelectItem = HSelectItem;
export const Modal = HModal;
export const ModalContent = HModalContent;
export const ModalHeader = HModalHeader;
export const ModalBody = HModalBody;
export const ModalFooter = HModalFooter;
export const ScrollShadow = HScrollShadow;
export const Pagination = HPagination;
export const Link = HLink;
export const Accordion = HAccordion;
export const AccordionItem = HAccordionItem;
export const Card = HCard;
export const CardHeader = HCardHeader;
export const CardBody = HCardBody;
export const CardFooter = HCardFooter;
export const Dropdown = HDropdown;
export const DropdownSection = HDropdownSection;
export const DropdownMenu = HDropdownMenu;
export const DropdownItem = HDropdownItem;
export const DropdownTrigger = HDropdownTrigger;
