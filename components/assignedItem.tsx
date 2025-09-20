import Link from "next/link";
import { DeleteRoom } from "./deleteRoom";
import { timeFormat12 } from "@/lib/utils";
import { Button, ButtonGroup } from "./ui/heroui";
import { Copy, Pen, Send } from "lucide-react";
import { addToast } from "@heroui/react";

export function AssignedItem({
  i,
  id,
  name,
  time,
  duration,
  link,
  isAm,
  onEdit,
  deleteFunc,
  refresh,
}: {
  i: number;
  id: string;
  name: string;
  time: string;
  duration: number;
  link: string;
  isAm: boolean;
  onEdit: () => void;
  deleteFunc: (id: string) => Promise<{
    status: boolean;
    message: string;
  }>;
  refresh: () => void;
}) {
  return (
    <div className="p-5 flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <p className="pr-2 font-semibold">{i}</p>
        <Link href={""} className="w-full capitalize">
          {name}
        </Link>
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="primary"
          onPress={onEdit}
        >
          <Pen className="size-4" />
        </Button>
        <DeleteRoom func={deleteFunc} id={id} refresh={refresh} />
      </div>
      <div className="flex gap-1 ">
        <p className="flex-1 content-center ">
          <span className="px-2 font-bold">{timeFormat12(time)}</span>
          for <span className="px-2 font-semibold">{duration}</span>m
        </p>
        {link && (
          <ButtonGroup
            size="sm"
            color="primary"
            variant="flat"
            className="gap-[2px] "
          >
            <Button
              startContent={<Send className="size-4" />}
              as={Link}
              href={link}
            >
              {isAm ? "ክፍል" : "Room"}
            </Button>
            <Button
              isIconOnly
              onPress={() => {
                navigator.clipboard
                  .writeText(link)
                  .then(() => {
                    addToast({
                      title: "Success",
                      description: "successfully copied",
                      color: "success",
                    });
                  })
                  .catch(() => {
                    addToast({
                      title: "Error",
                      description: "failed to copied",
                      color: "danger",
                    });
                  });
              }}
            >
              <Copy className="size-4" />
            </Button>
          </ButtonGroup>
        )}
      </div>
    </div>
  );
}
