"use client";

import { logout } from "@/actions/common/auth";
import { Button } from "@/components/ui/heroui";
import useMutation from "@/hooks/useMutation";
import { useParams, useRouter } from "next/navigation";
import React from "react";

export default function Logout() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const [action, isLoading] = useMutation(logout, (state) => {
    if (state.status) {
      router.refresh();
    }
  });
  return (
    <Button color="primary" onPress={action} isLoading={isLoading}>
      {lang == "am" ? "እንደገና ይሞክሩ" : "Refresh"}
    </Button>
  );
}
