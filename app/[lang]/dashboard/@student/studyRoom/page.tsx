"use client";

import { getStudyRoomsForStudent } from "@/actions/student/studyRoom";
import {
  Button,
  Card,
  CardBody,
  Skeleton,
} from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import useData from "@/hooks/useData";
import { ExternalLink, Video } from "lucide-react";

export default function Page() {
  const isAm = useAmharic();
  const [data, isLoading] = useData(getStudyRoomsForStudent, () => {});

  const handleJoinRoom = (zoomLink: string) => {
    window.open(zoomLink, "_blank");
  };

  return (
    <div className="p-3 lg:p-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-default-900">
            <Video className="size-6 text-primary" />
            {isAm ? "የመማሪያ ክፍሎች" : "Study Rooms"}
          </h1>
          <p className="text-sm text-default-500 mt-1">
            {isAm
              ? "የመማሪያ ክፍሎችን ይመልከቱ እና ይግቡ"
              : "View and join study rooms"}
          </p>
        </div>

        {isLoading || !data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardBody className="flex items-center justify-center py-12">
              <div className="text-center">
                <Video className="size-16 text-default-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-default-600 mb-2">
                  {isAm ? "የመማሪያ ክፍሎች የሉም" : "No Study Rooms"}
                </h3>
                <p className="text-sm text-default-400">
                  {isAm
                    ? "እስካሁን ምንም የመማሪያ ክፍሎች አልተገኙም"
                    : "No study rooms available yet"}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(({ id, name, zoomLink, createdAt }) => (
              <Card
                key={id}
                className="border border-default-200/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardBody className="p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="font-semibold text-lg text-default-900 mb-1">
                        {name}
                      </h3>
                      <p className="text-xs text-default-500">
                        {new Date(createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      color="primary"
                      variant="flat"
                      className="w-full"
                      endContent={<ExternalLink className="size-4" />}
                      onPress={() => handleJoinRoom(zoomLink)}
                    >
                      {isAm ? "ይግቡ" : "Join Room"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

