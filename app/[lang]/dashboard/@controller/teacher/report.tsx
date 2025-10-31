"use client";
import { useState } from "react";
import { useTeacher } from "./provider";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import {
  createReport,
  getReportByTeacher,
  getStudentsForReport,
} from "@/actions/controller/report";
import {
  Button,
  Skeleton,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
} from "@/components/ui/heroui";
import {
  Plus,
  BookOpen,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import { Chip } from "@heroui/react";
import CustomTable from "@/components/customTable";
import useAmharic from "@/hooks/useAmharic";

export function Report() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [learningSlot, setLearningSlot] = useState("");
  const [learningProgress, setLearningProgress] = useState<
    "present" | "absent" | "permission"
  >("present");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null);

  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => {
    console.log("Opening modal...");
    setIsOpen(true);
  };
  const onClose = () => {
    console.log("Closing modal...");
    setIsOpen(false);
  };
  const isAm = useAmharic();

  const {
    teacher: { selected },
  } = useTeacher();

  // Get teacher report data
  const [data, isLoading] = useData(getReportByTeacher, () => {}, selected);

  // Get students for the modal
  const [studentsData, isLoadingStudents] = useData(
    getStudentsForReport,
    () => {},
    selected
  );

  // Create report mutation
  const [createReportMutation, isCreating] = useMutation(createReport, () => {
    onClose();
    setSelectedStudent("");
    setLearningSlot("");
    setLearningProgress("present");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedStudentData(null);
  });

  // Handle student selection and auto-fill data
  const handleStudentSelection = (studentId: string) => {
    setSelectedStudent(studentId);

    // Find the selected student data
    const studentData = studentsData?.data?.find(
      (student) => student.id === studentId
    );
    if (
      studentData &&
      (studentData as any).roomStudent &&
      (studentData as any).roomStudent.length > 0
    ) {
      setSelectedStudentData(studentData);
      // Auto-fill learning slot from roomStudent.time
      setLearningSlot((studentData as any).roomStudent[0].time || "");
    } else {
      setSelectedStudentData(null);
      setLearningSlot("");
    }
  };

  // Handle create report
  const handleCreateReport = async () => {
    if (!selected || !selectedStudent || !learningSlot) {
      alert(isAm ? "እባክዎ ሁሉንም መስኮች ይሙሉ" : "Please fill all fields");
      return;
    }

    await createReportMutation({
      studentId: selectedStudent,
      activeTeacherId: selected,
      learningSlot,
      learningProgress,
      date: new Date(date),
    });
  };

  // Prepare table data
  const currentReports =
    data?.data?.currentProgress?.flatMap((progress) =>
      progress.dailyReports.map((report) => ({
        key: `${progress.id}-${report.id}`,
        id: report.id,
        studentName: `${progress.student.firstName} ${progress.student.lastName}`,
        studentPhone: progress.student.phoneNumber,
        learningSlot: progress.learningSlot,
        learningProgress: report.learningProgress,
        date: new Date(report.date).toLocaleDateString(),
        learningCount: progress.learningCount,
        missingCount: progress.missingCount,
      }))
    ) || [];

  const historicalReports =
    data?.data?.historicalProgress?.flatMap((progress) =>
      progress.dailyReports.map((report) => ({
        key: `hist-${progress.id}-${report.id}`,
        id: report.id,
        studentName: `${progress.student.firstName} ${progress.student.lastName}`,
        studentPhone: progress.student.phoneNumber,
        learningSlot: progress.learningSlot,
        learningProgress: report.learningProgress,
        date: new Date(report.date).toLocaleDateString(),
        learningCount: progress.learningCount,
        missingCount: progress.missingCount,
        status: "Historical",
      }))
    ) || [];

  const allReports = [...currentReports, ...historicalReports];

  const columns = [
    {
      key: "studentName",
      label: isAm ? "ተማሪ" : "Student",
    },
    {
      key: "studentPhone",
      label: isAm ? "ስልክ" : "Phone",
    },
    {
      key: "learningSlot",
      label: isAm ? "የትምህርት ሰላት" : "Learning Slot",
    },
    {
      key: "learningProgress",
      label: isAm ? "ሁኔታ" : "Status",
      renderCell: (item: any) => (
        <Chip
          color={
            item.learningProgress === "present"
              ? "success"
              : item.learningProgress === "permission"
              ? "warning"
              : "danger"
          }
          size="sm"
          variant="flat"
        >
          {item.learningProgress === "present"
            ? isAm
              ? "ተገኝቷል"
              : "Present"
            : item.learningProgress === "permission"
            ? isAm
              ? "ፈቃድ"
              : "Permission"
            : isAm
            ? "ጠፍቷል"
            : "Absent"}
        </Chip>
      ),
    },
    {
      key: "date",
      label: isAm ? "ቀን" : "Date",
    },
    {
      key: "learningCount",
      label: isAm ? "ተማሪ" : "Learning",
    },
    {
      key: "missingCount",
      label: isAm ? "ጠፍቷል" : "Missing",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="shrink-0 bg-default-50/50 rounded-xl grid grid-rows-[auto_auto_1fr] overflow-hidden gap-3 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">
            {isAm ? "መምህር ሪፖርት" : "Teacher Report"}
          </h1>
          <p className="text-sm sm:text-base text-default-500">
            {isAm
              ? "የተማሪዎች የትምህርት ሁኔታ ሪፖርት"
              : "Student learning progress reports"}
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="size-4" />}
          onPress={onOpen}
          className="w-full sm:w-auto bg-primary text-white hover:bg-primary-600"
          size="md"
        >
          {isAm ? "አዲስ ሪፖርት" : "New Report"}
        </Button>
      </div>

      {/* Reports Table */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardBody className="flex-1 p-0 overflow-auto">
          {/* <div className="h-full"> */}
          <div>
            <CustomTable
              columns={columns}
              rows={allReports}
              totalRows={allReports.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setPage(1);
              }}
              searchValue={search}
              onSearch={setSearch}
              isLoading={isLoading}
            />
          </div>
          {/* </div> */}
        </CardBody>
      </Card>

      {/* Create Report Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" className="mx-4">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-lg font-semibold">
              {isAm ? "አዲስ ሪፖርት ይፍጠሩ" : "Create New Report"}
            </h2>
          </ModalHeader>
          <ModalBody className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium text-default-700 mb-2 block">
                {isAm ? "ተማሪ" : "Student"}
              </label>
              <Select
                placeholder={
                  studentsData?.data?.length === 0
                    ? isAm
                      ? "ለዚህ መምህር ተማሪዎች አልተገኙም"
                      : "No students found for this teacher"
                    : isAm
                    ? "ተማሪ ይምረጡ"
                    : "Select Student"
                }
                selectedKeys={selectedStudent ? [selectedStudent] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleStudentSelection(selected);
                }}
                isLoading={isLoadingStudents}
                isDisabled={studentsData?.data?.length === 0}
              >
                {studentsData?.data?.map((student) => (
                  <SelectItem key={student.id}>
                    {student.firstName} {student.lastName} (@{student.username})
                  </SelectItem>
                )) || []}
              </Select>
              {studentsData?.data?.length === 0 && (
                <p className="text-sm text-warning mt-2">
                  {isAm
                    ? "እባክዎ በመጀመሪያ ተማሪዎችን ለዚህ መምህር ይመድቡ"
                    : "Please assign students to this teacher first"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-default-700 mb-2 block">
                  {isAm ? "የትምህርት ሰላት" : "Learning Slot"}
                  <span className="text-xs text-primary ml-1">
                    {isAm ? "(በራስ-ሰር ይመረጣል)" : "(Auto-filled)"}
                  </span>
                </label>
                <Input
                  placeholder={isAm ? "የትምህርት ሰላት" : "Learning Slot"}
                  value={learningSlot}
                  onChange={(e) => setLearningSlot(e.target.value)}
                  isReadOnly={
                    (selectedStudentData as any)?.roomStudent?.[0]?.time
                  }
                  className={
                    (selectedStudentData as any)?.roomStudent?.[0]?.time
                      ? "bg-default-100"
                      : ""
                  }
                />
                {(selectedStudentData as any)?.roomStudent?.[0]?.time && (
                  <p className="text-xs text-success mt-1">
                    {isAm
                      ? "የተማሪው የትምህርት ሰላት በራስ-ሰር ተመርጧል"
                      : "Student's learning slot auto-filled from room assignment"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-default-700 mb-2 block">
                  {isAm ? "የትምህርት ሁኔታ" : "Learning Status"}
                </label>
                <Select
                  placeholder={isAm ? "የትምህርት ሁኔታ" : "Learning Status"}
                  selectedKeys={[learningProgress]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as
                      | "present"
                      | "absent"
                      | "permission";
                    setLearningProgress(selected);
                  }}
                >
                  <SelectItem key="present">
                    {isAm ? "ተገኝቷል" : "Present"}
                  </SelectItem>
                  <SelectItem key="absent">
                    {isAm ? "ጠፍቷል" : "Absent"}
                  </SelectItem>
                  <SelectItem key="permission">
                    {isAm ? "ፈቃድ" : "Permission"}
                  </SelectItem>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-default-700 mb-2 block">
                  {isAm ? "ቀን" : "Date"}
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg space-y-2">
              <p className="text-sm text-primary">
                <strong>
                  {isAm ? "በራስ-ሰር የተመረጡ ዝርዝሮች:" : "Auto-filled Information:"}
                </strong>
              </p>
              <div className="space-y-1 text-xs">
                <p>
                  <strong>{isAm ? "መምህር ID:" : "Teacher ID:"}</strong>{" "}
                  {selected}
                </p>
                {selectedStudentData && (
                  <>
                    <p>
                      <strong>{isAm ? "ተማሪ ID:" : "Student ID:"}</strong>{" "}
                      {selectedStudentData.id}
                    </p>
                    <p>
                      <strong>{isAm ? "ተማሪ ስም:" : "Student Name:"}</strong>{" "}
                      {selectedStudentData.firstName}{" "}
                      {selectedStudentData.lastName}
                    </p>
                    {(selectedStudentData as any).roomStudent?.[0]?.time && (
                      <p>
                        <strong>
                          {isAm ? "የትምህርት ሰላት:" : "Learning Slot:"}
                        </strong>{" "}
                        {(selectedStudentData as any).roomStudent[0].time}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="light"
              onPress={onClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            <Button
              color="primary"
              onPress={handleCreateReport}
              isLoading={isCreating}
              isDisabled={
                !selectedStudent ||
                !learningSlot ||
                studentsData?.data?.length === 0
              }
              startContent={<FileText className="size-4" />}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isAm ? "ሪፖርት ይፍጠሩ" : "Create Report"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
