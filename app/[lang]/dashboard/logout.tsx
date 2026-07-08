"use client";

import { logout } from "@/actions/common/auth";
import { Button } from "@/components/ui/heroui";
import useMutation from "@/hooks/useMutation";
import { useParams, useRouter } from "next/navigation";
import React from "react";

export default function Logout() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const [action, isLoading] = useMutation(logout, () => {
    // The error card only shows when there is no valid logged-in user, so
    // clear any stale session and send the user to the login page.
    router.replace(`/${lang}/login`);
    router.refresh();
  });
  return (
    <Button color="primary" onPress={action} isLoading={isLoading}>
      {lang == "am" ? "እንደገና ይሞክሩ" : lang == "or" ? "Haaromsi" : "Refresh"}
    </Button>
  );
}
