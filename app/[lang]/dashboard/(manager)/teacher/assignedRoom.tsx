import { Button } from "@/components/ui/heroui";
import { Pen } from "lucide-react";
import { useTeacher } from "./provider";
import useAmharic from "@/hooks/useAmharic";
import { deleteRoom } from "@/actions/controller/room";
import { getStudentList } from "@/actions/controller/student";
import { AssignedItem } from "@/components/assignedItem";
import { AssignRoom } from "@/components/assignRoom";

export default function AssignedRoom() {
  const {
    teacher: { selected },
    detail: { data, registration, refresh },
  } = useTeacher();
  const isAm = useAmharic();

  return (
    <div className="shrink-0 bg-default-50/50 rounded-xl grid grid-rows-[auto_1fr] overflow-hidden ">
      <div className="px-2 py-2 shadow flex gap-2">
        <p className="flex-1 content-center ">
          {isAm ? "የተመደበ ክፍል" : "Assigned Room"}
        </p>
        <Button
          color="primary"
          variant="flat"
          startContent={<Pen className="size-4" />}
          onPress={registration.edit.bind(undefined, {
            id: "",
            studentId: "",
            teacherId: selected,
            time: new Date().toTimeString().slice(0, 6) + "00",
            duration: "",
          })}
        >
          {isAm ? "ይመድቡ" : "Assign"}
        </Button>
      </div>
      <div className="divide-y divide-default-50/80 flex flex-col gap-2 overflow-auto">
        {data?.room.map(({ id, student, time, duration, link }, i) => (
          <AssignedItem
            key={i + ""}
            {...{
              i: i + 1,
              id,
              name: `${student.firstName} ${student.fatherName ?? ""} ${
                student.lastName ?? ""
              }`,
              time,
              duration,
              link,
              isAm,
              onEdit() {
                registration.edit({
                  id,
                  teacherId: selected,
                  studentId: student.id,
                  time,
                  duration: duration + "",
                });
              },
              deleteFunc: deleteRoom,
              refresh,
            }}
          />
        ))}
      </div>
      <AssignRoom
        idTitle="studentId"
        registration={registration}
        getList={getStudentList}
        title={isAm ? "ተማሪ" : "Student"}
      />
    </div>
  );
}
