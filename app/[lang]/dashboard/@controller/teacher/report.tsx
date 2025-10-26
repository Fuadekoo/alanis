import { useState } from "react";
import { useTeacher } from "./provider";
import useData from "@/hooks/useData";
import { getReportByTeacher } from "@/actions/controller/report";
import {
  Button,
  ButtonGroup,
  Skeleton,
  Card,
  CardBody,
  CardHeader,
} from "@/components/ui/heroui";
import {
  Minus,
  Plus,
  BookOpen,
  UserCheck,
  UserX,
  FileText,
} from "lucide-react";
import { Chip } from "@heroui/react";

export function Report() {
  const [filter, setFilter] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const {
    teacher: { selected },
  } = useTeacher();

  const [data, isLoading] = useData(getReportByTeacher, () => {}, selected);

  if (isLoading) {
    return (
      <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-danger">
            Error Loading Report
          </h2>
          <p className="text-sm text-default-500">
            {data?.error || "Failed to load teacher report"}
          </p>
        </div>
      </div>
    );
  }

  const { currentProgress, historicalProgress, statistics } = data.data;

  return (
    <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden">
      {/* Header with Statistics */}
      <div className="grid gap-2">
        <h1 className="text-xl font-bold text-center">Teacher Report</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-success" />
                <div>
                  <p className="text-xs text-default-500">Current Students</p>
                  <p className="text-lg font-bold">
                    {statistics.current.totalStudents}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-default-500">Learning Sessions</p>
                  <p className="text-lg font-bold">
                    {statistics.overall.totalLearningCount}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-warning" />
                <div>
                  <p className="text-xs text-default-500">Missing Sessions</p>
                  <p className="text-lg font-bold">
                    {statistics.overall.totalMissingCount}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-secondary" />
                <div>
                  <p className="text-xs text-default-500">Total Reports</p>
                  <p className="text-lg font-bold">
                    {statistics.overall.totalReports}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Current Progress Section */}
      <div className="overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Current Students</h2>

            {currentProgress.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-default-500">No current students assigned</p>
              </div>
            ) : (
              currentProgress.map((progress) => (
                <Card key={progress.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {progress.student.firstName}{" "}
                          {progress.student.lastName}
                        </h3>
                        <p className="text-sm text-default-500">
                          @{progress.student.username}
                        </p>
                      </div>
                      <Chip
                        color={
                          progress.progressStatus === "open"
                            ? "success"
                            : "default"
                        }
                        size="sm"
                      >
                        {progress.progressStatus}
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-default-500">Learning</p>
                        <p className="font-bold text-success">
                          {progress.learningCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Missing</p>
                        <p className="font-bold text-warning">
                          {progress.missingCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Slot</p>
                        <p className="font-bold text-primary">
                          {progress.learningSlot}
                        </p>
                      </div>
                    </div>

                    {progress.dailyReports.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-default-500 mb-2">
                          Recent Reports:
                        </p>
                        <div className="space-y-1">
                          {progress.dailyReports.slice(0, 3).map((report) => (
                            <div
                              key={report.id}
                              className="flex justify-between items-center text-xs"
                            >
                              <span>
                                {new Date(report.date).toLocaleDateString()}
                              </span>
                              <Chip
                                color={
                                  report.learningProgress === "present"
                                    ? "success"
                                    : report.learningProgress === "permission"
                                    ? "primary"
                                    : "warning"
                                }
                                size="sm"
                              >
                                {report.learningProgress}
                              </Chip>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </div>

          {/* Historical Progress Section */}
          {historicalProgress.length > 0 && (
            <div className="mt-6 space-y-3">
              <h2 className="text-lg font-semibold">Previous Students</h2>

              {historicalProgress.map((shift) => (
                <Card key={shift.id} className="opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {shift.student.firstName} {shift.student.lastName}
                        </h3>
                        <p className="text-sm text-default-500">
                          @{shift.student.username}
                        </p>
                      </div>
                      <Chip color="default" size="sm">
                        Completed
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-default-500">Learning</p>
                        <p className="font-bold text-success">
                          {shift.learningCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Missing</p>
                        <p className="font-bold text-warning">
                          {shift.missingCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Slot</p>
                        <p className="font-bold text-primary">
                          {shift.learningSlot}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-default-500">
                      Completed:{" "}
                      {new Date(shift.createdAt).toLocaleDateString()}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
