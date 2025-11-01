"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Skeleton,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/heroui";
import {
  getAllShiftTeacherData,
  getAllTeacherProgress,
  getTeachersForReport,
  changeTeacher,
} from "@/actions/controller/report";
import {
  Search,
  RefreshCw,
  User,
  BookOpen,
  Calendar,
  History,
  Clock,
  Link as LinkIcon,
} from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

export default function Page() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Shift form states
  const [selectedProgressId, setSelectedProgressId] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newLearningSlot, setNewLearningSlot] = useState("");
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newLink, setNewLink] = useState("");
  const [isShifting, setIsShifting] = useState(false);

  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();

  // Get shift teacher data (historical)
  const [shiftData, isLoadingShifts, refreshShifts] = useData(
    getAllShiftTeacherData,
    () => {},
    currentPage,
    10,
    search
  );

  // Get active teacher progress for modal
  const [teacherProgressData, isLoadingProgress] = useData(
    getAllTeacherProgress,
    () => {},
    1,
    100,
    ""
  );

  // Get teachers for selection
  const [teachersData, isLoadingTeachers] = useData(
    getTeachersForReport,
    () => {}
  );

  const resetForm = () => {
    setSelectedProgressId("");
    setNewTeacherId("");
    setNewLearningSlot("");
    setNewDuration(60);
    setNewLink("");
  };

  const handleShiftTeacher = async () => {
    if (!selectedProgressId || !newTeacherId) {
      showAlert({
        message: isAm
          ? "እባክዎ የተማሪ ሂደት እና አዲስ መምህር ይምረጡ"
          : "Please select student progress and new teacher",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    setIsShifting(true);
    try {
      const result = await changeTeacher({
        currentTeacherProgressId: selectedProgressId,
        newTeacherId,
        newLearningSlot: newLearningSlot || undefined,
        newDuration: newDuration || undefined,
        newLink: newLink || undefined,
      });

      if (result.success) {
        setIsModalOpen(false);
        resetForm();
        if (refreshShifts) {
          refreshShifts();
        }
        showAlert({
          message: isAm
            ? "መምህሩ በተሳካ ሁኔታ ተቀይሯል! ክፍል ምደባም ተዘምኗል።"
            : "Teacher changed successfully! Room assignment has been updated.",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
      } else {
        showAlert({
          message:
            result.error ||
            (isAm ? "መምህር መቀየር አልተሳካም" : "Failed to change teacher"),
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch (error) {
      showAlert({
        message: isAm ? "መምህር መቀየር አልተሳካም" : "Failed to change teacher",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    } finally {
      setIsShifting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isAm ? "መምህር ማዛወሪያ ታሪክ" : "Teacher Shift History"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isAm
                ? "የተማሪ መምህር ለውጦችን ይመልከቱ እና አዲስ ይፍጠሩ"
                : "View student teacher changes and create new shifts"}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<RefreshCw className="size-4" />}
            onPress={() => {
              setIsModalOpen(true);
              resetForm();
            }}
          >
            {isAm ? "መምህር ቀይር" : "Shift Teacher"}
          </Button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder={isAm ? "ፈልግ..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Search className="size-4" />}
            className="flex-1"
          />
        </div>

        {/* Shift History List */}
        <div>
          {isLoadingShifts ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : shiftData?.success && shiftData.data ? (
            <div className="space-y-2">
              {shiftData.data.shiftData.map((shift) => (
                <Card key={shift.id}>
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="size-4 text-primary" />
                          <span className="font-semibold">
                            {highlight(
                              `${shift.student.firstName} ${shift.student.lastName}`,
                              search
                            )}
                          </span>
                          <span className="text-sm text-default-500">
                            (@{shift.student.username})
                          </span>
                          <Chip size="sm" color="warning" variant="flat">
                            <History className="size-3 mr-1" />
                            {isAm ? "ታሪካዊ" : "Historical"}
                          </Chip>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="size-4 text-secondary" />
                          <span className="text-sm">
                            {isAm ? "የድሮ መምህር:" : "Previous Teacher:"}{" "}
                            {highlight(
                              `${shift.teacher.firstName} ${shift.teacher.lastName}`,
                              search
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-default-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(shift.createdAt).toLocaleDateString()}
                          </div>
                          {shift.learningSlot && (
                            <div className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {isAm ? "ሰዓት:" : "Slot:"} {shift.learningSlot}
                            </div>
                          )}
                          <Chip color="success" size="sm" variant="flat">
                            {isAm ? "መማር:" : "Learning:"} {shift.learningCount}
                          </Chip>
                          <Chip color="danger" size="sm" variant="flat">
                            {isAm ? "ጎደለ:" : "Missing:"} {shift.missingCount}
                          </Chip>
                          <Chip color="primary" size="sm" variant="flat">
                            {isAm ? "ጠቅላላ:" : "Total:"} {shift.totalCount}
                          </Chip>
                        </div>

                        {shift.paymentStatus && (
                          <div className="mt-2">
                            <Chip
                              size="sm"
                              color={
                                shift.paymentStatus === "approved"
                                  ? "success"
                                  : shift.paymentStatus === "pending"
                                  ? "warning"
                                  : "danger"
                              }
                            >
                              {isAm ? "ክፍያ:" : "Payment:"}{" "}
                              {shift.paymentStatus === "approved"
                                ? isAm
                                  ? "ጸድቋል"
                                  : "Approved"
                                : shift.paymentStatus === "pending"
                                ? isAm
                                  ? "በመጠባበቅ ላይ"
                                  : "Pending"
                                : isAm
                                ? "ተቀባይነት አላገኘም"
                                : "Rejected"}
                            </Chip>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}

              {shiftData.data?.shiftData.length === 0 && (
                <div className="text-center py-12">
                  <History className="size-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-default-600 mb-2">
                    {isAm ? "የመምህር ለውጥ ታሪክ የለም" : "No Shift History"}
                  </h3>
                  <p className="text-sm text-default-400">
                    {isAm
                      ? "ገና ምንም መምህር አልተቀየረም። ከላይ ያለውን መምህር ቀይር ቁልፍ ይጫኑ።"
                      : "No teachers have been shifted yet. Click the Shift Teacher button above to create one."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-danger">
                {isAm ? "መረጃ ማግኘት አልተቻለም" : "Failed to load data"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {shiftData?.success &&
            shiftData.data &&
            shiftData.data.totalPages > 1 && (
              <div className="mt-4">
                <PaginationPlace
                  currentPage={currentPage}
                  totalPage={shiftData.data.totalPages}
                  onPageChange={setCurrentPage}
                  sort={false}
                  onSortChange={() => {}}
                  row={10}
                  onRowChange={() => {}}
                />
              </div>
            )}
        </div>
      </div>

      {/* Shift Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-md",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">
              {isAm ? "መምህር ይቀይሩ" : "Shift Teacher"}
            </h2>
            <p className="text-sm text-default-500 font-normal">
              {isAm
                ? "ተማሪን ወደ አዲስ መምህር ያዛውሩ"
                : "Transfer a student to a new teacher"}
            </p>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {/* Select Student Progress */}
            <div>
              <label className="text-sm font-medium text-default-700 mb-2 block">
                {isAm ? "ተማሪ / የአሁን ሂደት *" : "Student / Current Progress *"}
              </label>
              <Select
                placeholder={
                  isAm
                    ? "ተማሪ እና የአሁን መምህር ይምረጡ"
                    : "Select student and current teacher"
                }
                selectedKeys={selectedProgressId ? [selectedProgressId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedProgressId(selected);

                  // Auto-fill learning slot from selected progress
                  const progress =
                    teacherProgressData?.data?.teacherProgress.find(
                      (p) => p.id === selected
                    );
                  if (progress?.learningSlot) {
                    setNewLearningSlot(progress.learningSlot);
                  }
                }}
                isLoading={isLoadingProgress}
                description={
                  isAm
                    ? "መምህሩ የሚቀየርለትን ተማሪ ይምረጡ"
                    : "Select the student whose teacher you want to change"
                }
              >
                {(teacherProgressData?.data?.teacherProgress || []).map(
                  (progress) => (
                    <SelectItem
                      key={progress.id}
                      textValue={`${progress.student.firstName} ${progress.student.lastName} - ${progress.teacher.firstName} ${progress.teacher.lastName}`}
                    >
                      <div className="flex flex-col py-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {progress.student.firstName}{" "}
                            {progress.student.lastName}
                          </span>
                          <span className="text-xs text-default-400">
                            @{progress.student.username}
                          </span>
                        </div>
                        <div className="text-xs text-secondary mt-1">
                          {isAm ? "የአሁን መምህር:" : "Current Teacher:"}{" "}
                          {progress.teacher.firstName}{" "}
                          {progress.teacher.lastName}
                        </div>
                        {progress.learningSlot && (
                          <div className="text-xs text-primary mt-1">
                            {isAm ? "ሰዓት:" : "Slot:"} {progress.learningSlot}
                          </div>
                        )}
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-success">
                            {isAm ? "መማር:" : "Learning:"}{" "}
                            {progress.learningCount}
                          </span>
                          <span className="text-xs text-danger">
                            {isAm ? "ጎደለ:" : "Missing:"} {progress.missingCount}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  )
                )}
              </Select>
            </div>

            {/* Select New Teacher */}
            <div>
              <label className="text-sm font-medium text-default-700 mb-2 block">
                {isAm ? "አዲስ መምህር *" : "New Teacher *"}
              </label>
              <Select
                placeholder={isAm ? "አዲስ መምህር ይምረጡ" : "Select new teacher"}
                selectedKeys={newTeacherId ? [newTeacherId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNewTeacherId(selected);
                }}
                isLoading={isLoadingTeachers}
                description={
                  isAm
                    ? "ተማሪው የሚዛወርበትን አዲስ መምህር ይምረጡ"
                    : "Select the new teacher for this student"
                }
              >
                {(teachersData?.data || []).map((teacher) => (
                  <SelectItem key={teacher.id}>
                    {teacher.firstName} {teacher.lastName} (@{teacher.username})
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* New Learning Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-default-700 mb-2 block">
                  {isAm ? "አዲስ የትምህርት ሰዓት" : "New Learning Slot"}
                </label>
                <Input
                  placeholder={isAm ? "ለምሳሌ: ጠዋት 9:00" : "e.g., Morning 9:00"}
                  value={newLearningSlot}
                  onChange={(e) => setNewLearningSlot(e.target.value)}
                  startContent={<Clock className="size-4" />}
                  description={
                    isAm
                      ? "ባዶ ከሆነ የድሮውን ሰዓት ይጠቀማል"
                      : "Leave empty to keep old slot"
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-default-700 mb-2 block">
                  {isAm ? "ቆይታ (ደቂቃዎች)" : "Duration (minutes)"}
                </label>
                <Input
                  type="number"
                  value={newDuration.toString()}
                  onChange={(e) =>
                    setNewDuration(parseInt(e.target.value) || 60)
                  }
                  min={1}
                  startContent={<Clock className="size-4" />}
                />
              </div>
            </div>

            {/* Room Link */}
            <div>
              <label className="text-sm font-medium text-default-700 mb-2 block">
                {isAm ? "የክፍል አገናኝ (አማራጭ)" : "Room Link (Optional)"}
              </label>
              <Input
                placeholder={isAm ? "የክፍል መስመር ላይ አገናኝ" : "Online room link"}
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                startContent={<LinkIcon className="size-4" />}
              />
            </div>

            {/* Warning */}
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-700 dark:text-warning-400">
                <strong>{isAm ? "ማስጠንቀቂያ:" : "Warning:"}</strong>{" "}
                {isAm
                  ? "መምህሩን መቀየር የድሮውን ክፍል ምደባ ያጠፋል፣ ሁሉንም ታሪካዊ መረጃዎች ይቀመጣል፣ እና አዲስ ክፍል ምደባ ይፈጥራል። ይህ ተግባር መመለስ አይቻልም።"
                  : "Changing the teacher will delete old room assignment, preserve all historical data, and create a new room assignment. This action cannot be undone."}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              isDisabled={isShifting}
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            <Button
              color="warning"
              onPress={handleShiftTeacher}
              isLoading={isShifting}
              isDisabled={!selectedProgressId || !newTeacherId}
              startContent={<RefreshCw className="size-4" />}
            >
              {isAm ? "መምህር ይቀይሩ" : "Shift Teacher"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        isOpen={isAlertOpen}
        onClose={closeAlert}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        confirmText={alertOptions.confirmText || (isAm ? "እሺ" : "OK")}
        cancelText={alertOptions.cancelText}
        onConfirm={alertOptions.onConfirm}
        showCancel={alertOptions.showCancel}
      />
    </div>
  );
}
