import { cn } from "@heroui/react";

export default function Loading({
  className,
  classNames,
}: {
  className?: string;
  classNames?: { base?: string; loading?: string };
}) {
  return (
    <div
      className={cn("grid place-content-center ", className, classNames?.base)}
    >
      <div
        className={cn(
          "relative size-20 ",
          "after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-primary after:animate-[loadingPulse_2s_linear_infinite] after:ease-in-out after:transition-background after:duration-300 after:[animation-delay:-1s] ",
          "before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-primary before:animate-[loadingPulse_2s_linear_infinite] before:transition-background before:duration-300 ",
          classNames?.loading
        )}
      />
    </div>
  );
}
