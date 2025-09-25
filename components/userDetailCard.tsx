import useAmharic from "@/hooks/useAmharic";
import { Button } from "./ui/heroui";
import Link from "next/link";
import Image from "next/image";
import { Pen, Send, Trash } from "lucide-react";

export default function UserDetailCard({
  firstName,
  fatherName,
  lastName,
  balance,
  gender,
  age,
  country,
  phoneNumber,
  status,
  registerDate,
  startDate,
  controller,
  onEdit,
  onDelete,
}: {
  firstName: string;
  fatherName: string;
  lastName: string;
  balance: number;
  gender: "Female" | "Male";
  age: number;
  country: string;
  phoneNumber: string;
  status: React.ReactNode;
  registerDate: Date;
  startDate: Date | null;
  controllerId?: string | null;
  controller?: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
  } | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAm = useAmharic();

  return (
    <div className="p-2 bg-default-50/50 rounded-xl ">
      <p className="capitalize font-semibold">{`${firstName} ${fatherName} ${lastName}`}</p>
      <p className="capitalize font-semibold">{`Balance: ${balance} ETB`}</p>
      {/* <p className="capitalize font-semibold">{`Username: ${username}`}</p> */}
      {/* <p className="capitalize font-semibold">{`Phone: ${phoneNumber}`}</p> */}
      <p className="flex gap-2 capitalize">
        <span className="w-20">{isAm ? "ፆታ" : "Gender"}</span>
        <span className="">
          {isAm ? (gender == "Female" ? "ሴት" : "ወንድ") : gender}
        </span>
      </p>
      <p className="flex gap-2 capitalize">
        <span className="w-20">{isAm ? "እድሜ" : "Age"}</span>
        <span className="">{age}</span>
      </p>
      <p className="flex gap-2 capitalize">
        <span className="w-20">{isAm ? "ሀገር" : "Country"}</span>
        <span className="">{country}</span>
      </p>
      {phoneNumber ? (
        <div className="flex gap-2">
          <span className="flex-1 content-center  ">{phoneNumber}</span>
          <Button
            isIconOnly
            variant="flat"
            className="size-fit p-1 bg-green-500/20 text-green-700"
            as={Link}
            href={`https://wa.me/${phoneNumber}`}
          >
            <Image
              alt=""
              src={"/whatsapp.svg"}
              width={100}
              height={100}
              className="size-10"
            />
          </Button>
          <Button
            isIconOnly
            variant="flat"
            className="size-fit p-1 bg-sky-500/20 text-sky-700"
            as={Link}
            href={`https://t.me/+${phoneNumber}`}
          >
            <Image
              alt=""
              src={"/telegram.svg"}
              width={100}
              height={100}
              className="size-10"
            />
          </Button>
        </div>
      ) : (
        <div className=""></div>
      )}
      <div className="flex gap-2">
        <p className="w-20 content-center">
          {isAm ? "የተመዘገበበት ቀን" : "Register Date"}
        </p>
        {registerDate.toString().slice(4, 15)}
      </div>
      <div className="flex gap-2">
        <p className="w-20 content-center">
          {isAm ? "የጀመረበት ቀን" : "Start Date"}
        </p>
        {startDate?.toString().slice(4, 15) ?? "_-_-_-_-_-"}
      </div>
      {controller && (
        <div className="flex gap-2">
          <p className="w-20 content-center">{isAm ? "ተቆጣጣሪ" : "controller"}</p>
          {controller.firstName} {controller.fatherName} {controller.lastName}
        </div>
      )}
      <div className="flex gap-2">
        <p className="w-20 content-center">{isAm ? "ሁኔታ" : "status"}</p>
        {status}
      </div>
      <div className="pt-5 grid gap-2 grid-cols-3 ">
        <Button
          variant="flat"
          color="primary"
          className=""
          startContent={<Send className="size-4 shrink-0 " />}
          as={Link}
          href={`/${isAm ? "am" : "en"}/dashboard/chat`}
        >
          {isAm ? "ቻት" : "Chat"}
        </Button>
        <Button
          variant="flat"
          color="primary"
          className=""
          startContent={<Pen className="size-4 shrink-0" />}
          onPress={onEdit}
        >
          {isAm ? "ያስተካክሉ" : "Edit"}
        </Button>
        <Button
          color="danger"
          variant="flat"
          startContent={<Trash className="size-4 shrink-0" />}
          onPress={onDelete}
        >
          {isAm ? "ይሰርዙ" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
