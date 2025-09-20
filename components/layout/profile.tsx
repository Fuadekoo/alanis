"use client";

import { LogOut, User, UserCircle } from "lucide-react";
import {
  Button,
  CModal,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
} from "../ui/heroui";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";
import useMutation from "@/hooks/useMutation";
import { logout } from "@/actions/common/auth";
import useData from "@/hooks/useData";
import { getUser } from "@/actions/common/user";

export default function Profile() {
  const { lang } = useParams<{ lang: string }>();
  const [data] = useData(getUser, () => {});
  const [logout, setLogout] = useState(false);

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          {data ? (
            <Button
              variant="flat"
              color="primary"
              className="flex-1 h-fit py-2 gap-2 justify-start items-start text-start text-primary-700 "
            >
              <span className="">
                <UserCircle strokeWidth={1} className="size-10 " />
              </span>
              <div className="">
                <p className="capitalize ">
                  {data.firstName} {data.fatherName}
                </p>
                <p className=" text-sm text-default-600">{data.role}</p>
              </div>
            </Button>
          ) : (
            <Skeleton className="h-14 flex-1 " />
          )}
        </DropdownTrigger>
        <DropdownMenu variant="flat" color="primary">
          <DropdownSection>
            {[
              {
                label: "Profile",
                icon: <User className="size-4" />,
                url: "profile",
              },
            ].map(({ label, icon, url }, i) => (
              <DropdownItem
                key={i + ""}
                startContent={icon}
                as={Link}
                href={`/${lang}/dashboard/${url}`}
              >
                {label}
              </DropdownItem>
            ))}
          </DropdownSection>
          <DropdownSection>
            <DropdownItem
              color="danger"
              key={"logout"}
              startContent={<LogOut className="size-4" />}
              onPress={() => setLogout(true)}
            >
              Logout
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
      <LogOutModal isOpen={logout} onOpenChange={() => setLogout(false)} />
    </>
  );
}

function LogOutModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
}) {
  const router = useRouter();
  const [action, isLoading] = useMutation(logout, (state) => {
    if (state.status) {
      router.refresh();
    }
  });

  return (
    <CModal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onclose) => (
          <>
            <ModalHeader className="text-danger-600">Logout</ModalHeader>
            <ModalBody>
              <p className="">
                Are you sure do you want to{" "}
                <span className="text-danger-600">logout</span>?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onclose}>
                Back
              </Button>
              <Button color="danger" isLoading={isLoading} onPress={action}>
                Logout
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}
