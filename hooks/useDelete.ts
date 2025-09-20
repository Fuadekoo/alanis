import { useCallback, useState, useTransition } from "react";

export type UseDelete = ReturnType<typeof useDelete>;

export default function useDelete<State>(
  func: (id: string) => Promise<State>,
  onFinish?: (state: Awaited<State>) => void
): {
  isOpen: boolean;
  open: (id: string) => void;
  close: () => void;
  handle: () => void;
  isLoading: boolean;
} {
  const [deleteId, setDeleteId] = useState("");
  const [isLoading, startTransition] = useTransition();
  const handle = useCallback(() => {
    startTransition(async () => {
      const result = await func(deleteId);
      onFinish?.(result);
      setDeleteId("");
    });
  }, [deleteId]);

  return {
    isOpen: !!deleteId,
    open: setDeleteId,
    close: setDeleteId.bind(undefined, ""),
    handle,
    isLoading,
  };
}
