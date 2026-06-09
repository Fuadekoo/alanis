import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { role as Role } from "@prisma/client";
import { ReadonlyURLSearchParams } from "next/navigation";
import { DefaultValues, FieldValues, FormState } from "react-hook-form";
import { z } from "zod";

export function getFormErrors<TFieldValues extends FieldValues>(
  formState: FormState<TFieldValues>
): { [Key in keyof TFieldValues]: string } {
  return Object.entries(formState.errors).reduce(
    (acc, [n, v]) => ({ ...acc, [n]: v?.message }),
    {} as { [Key in keyof TFieldValues]: string }
  );
}

export async function isAuthorized(role: Role | Role[]) {
  const error = new Error("You need have authorized to access this 😉");
  const session = await auth();

  const allowedRoles = Array.isArray(role) ? role : [role];
  const sessionRole = session?.user?.role as Role | undefined;

  if (!session?.user || !sessionRole) throw error;

  const hasRole = allowedRoles.includes(sessionRole);

  if (!hasRole) throw error;

  if (!session.user.id) {
    return { id: "", role: sessionRole };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return { id: session.user.id, role: sessionRole };
  }

  return {
    id: user.id,
    role: sessionRole,
  };
}

export function timeFormat24(time: string) {
  if (!time) return "";
  const [onlyTime, formate] = time.split(" ");
  const [hour, minute] = onlyTime.split(":");

  return `${formate == "AM" ? +hour + 12 : hour}:${minute}`;
}
export function timeFormat12(time: string) {
  if (!time) return "";
  const [hour, minute] = time.split(":");

  return `${+hour % 12 || 12}:${minute ?? ""} ${+hour >= 12 ? "PM" : "AM"}`;
}

export function isWithinScheduledClassSlot(
  time: string,
  durationMinutes: number
) {
  if (!time) return false;

  const [hourPart, minutePart] = time.split(":");
  const startHour = parseInt(hourPart, 10);
  const startMinute = parseInt(minutePart ?? "0", 10);
  if (Number.isNaN(startHour) || Number.isNaN(startMinute)) return false;

  const ethiopiaOffsetMs = 3 * 60 * 60 * 1000;
  const ethiopiaNow = new Date(Date.now() + ethiopiaOffsetMs);
  const nowMinutes =
    ethiopiaNow.getUTCHours() * 60 + ethiopiaNow.getUTCMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = startMinutes + durationMinutes;

  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

export function isRoomActiveNow(
  roomStudent: { link: string; time: string; duration: number } | null | undefined
) {
  if (!roomStudent) return false;
  if (roomStudent.link?.trim()) return true;
  return isWithinScheduledClassSlot(roomStudent.time, roomStudent.duration);
}

export function timeFormat(date: Date) {
  let hour = date.getHours();
  const minute = date.getMinutes();

  const amOrPm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const h = hour < 10 ? "0" + hour : hour;
  const m = minute < 10 ? "0" + minute : minute;

  return `${h} : ${m} ${amOrPm}`;
}

export function sorting(first: string, second: string, direction: boolean) {
  return direction
    ? first > second
      ? 1
      : first < second
      ? -1
      : 0
    : first > second
    ? -1
    : first < second
    ? 1
    : 0;
}

export function getSliced<T>(data: T[], currentPage: number, row: number): T[] {
  return data.slice((currentPage - 1) * row, currentPage * row);
}

export function getError(err: unknown) {
  const data = JSON.parse(JSON.stringify(err)).meta.target;
  if (data == "user_username_key" || data.includes("username")) {
    return "username already exists";
  } else {
    return "something went wrong";
  }
}

export function getDefaults<
  T extends z.ZodTypeAny,
  TFieldValues extends FieldValues = FieldValues
>(
  schema: T
):
  | DefaultValues<TFieldValues>
  | ((payload?: unknown) => Promise<TFieldValues>)
  | undefined {
  if (schema instanceof z.ZodDefault) {
    return schema._def.defaultValue();
  } else if (schema instanceof z.ZodObject) {
    return Object.fromEntries(
      Object.entries(schema.shape).map(([key, value]) => [
        key,
        getDefaults(value as z.ZodTypeAny),
      ])
    ) as DefaultValues<TFieldValues>;
  }
  return undefined;
}

export function addQuery(
  searchParams:
    | ReadonlyURLSearchParams
    | { [index: string]: string | string[] | undefined },
  query?: { name: string; value: string | number | boolean }[]
) {
  const params = new URLSearchParams(
    searchParams instanceof ReadonlyURLSearchParams
      ? searchParams.toString()
      : undefined
  );
  if (!(searchParams instanceof ReadonlyURLSearchParams)) {
    Object.entries(searchParams).forEach(([name, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          params.set(name, v);
        });
      } else {
        params.set(name, value ?? "");
      }
    });
  }
  query?.forEach(({ name, value }) => {
    params.set(name, value.toString());
  });

  return params.toString();
}

export function highlight(
  data: string,
  key: string,
  className: string = "bg-secondary-200 text-secondary-700"
) {
  const array = data.split(key);
  return array.map((v, i) => (
    <span key={i}>
      {v}
      {i !== array.length - 1 && <span className={className}>{key}</span>}
    </span>
  ));
}

export function getLocalDate(date: Date) {
  const offSet = new Date().getTimezoneOffset();
  const TMinute = offSet + 180 + date.getHours() * 60 + date.getMinutes();
  const hour = Math.floor(TMinute / 60);
  const minute = (TMinute + 180) % 60;

  date.setHours(hour);
  date.setMinutes(minute);

  return date;
}
