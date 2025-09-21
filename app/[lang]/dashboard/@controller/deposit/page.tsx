"use client";
import React, { useState, useMemo } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { useRegistration } from "@/hooks/useRegistration";
import { DepositSchema } from "@/lib/zodSchema";
import {
  Button,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  CModal,
  Form,
  Skeleton,
} from "@/components/ui/heroui";
import {
  getDeposit,
  depositCreate,
  deleteDeposit,
  depositUpdate,
  getStudent,
} from "@/actions/controller/deposit";
import z from "zod";
import { useDebouncedCallback } from "use-debounce";
import Select from "react-select";
import chroma from "chroma-js";

// Define the student option type
interface StudentOption {
  value: string;
  label: string;
  color?: string;
}

// Define styles for react-select
const selectStyles = {
  control: (styles: any) => ({
    ...styles,
    backgroundColor: "white",
    minHeight: "44px",
    borderRadius: "8px",
  }),
  option: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
    const color = chroma(data.color || "#2684FF");
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? data.color
        : isFocused
        ? color.alpha(0.1).css()
        : undefined,
      color: isDisabled
        ? "#ccc"
        : isSelected
        ? chroma.contrast(color, "white") > 2
          ? "white"
          : "black"
        : data.color,
      cursor: isDisabled ? "not-allowed" : "default",

      ":active": {
        ...styles[":active"],
        backgroundColor: !isDisabled
          ? isSelected
            ? data.color
            : color.alpha(0.3).css()
          : undefined,
      },
    };
  },
  input: (styles: any) => ({ ...styles, height: "40px" }),
  placeholder: (styles: any) => ({ ...styles, color: "#aaa" }),
  singleValue: (styles: any, { data }: any) => ({
    ...styles,
    color: data.color,
  }),
};

// Deposit schema for registration form
const depositSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.string().min(1, "Amount is required"),
  photo: z.string().optional(),
});

function Page() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Data fetching
  const [data, isLoading, refresh] = useData(
    getDeposit,
    () => {},
    "all",
    page,
    pageSize,
    search
  );

  // Registration (add/edit) logic - Fixed to match hook signature
  const form = useRegistration(
    async (values: any) => {
      if (editingId) {
        return depositUpdate(editingId, values);
      }
      return depositCreate(values);
    },
    depositSchema,
    (state) => {
      if (state?.status) {
        refresh();
        setEditingId(null);
        form.onOpenChange();
      }
    }
  );

  // Delete logic
  const deletion = useDelete(deleteDeposit, (state) => {
    if (state.status) {
      refresh();
      deletion.close();
    }
  });

  const rows = (data?.data || []).map((deposit) => ({
    key: String(deposit.id),
    id: String(deposit.id),
    studentFullName: deposit.depositedTo
      ? `${deposit.depositedTo.firstName} ${deposit.depositedTo.fatherName} ${deposit.depositedTo.lastName}`
      : "N/A",
    amount: deposit.amount != null ? String(deposit.amount) : "",
    photo: deposit.photo ?? "",
    status: deposit.status ?? "",
    createdAt: deposit.createdAt ?? "",
    // Add these fields for editing
    studentId: deposit.studentId || "",
  }));

  const columns = [
    {
      key: "studentFullName",
      label: "Student Name",
      renderCell: (item: any) => item.studentFullName,
    },
    {
      key: "amount",
      label: "Amount",
      renderCell: (item: any) => (
        <span>${Number(item.amount).toLocaleString()}</span>
      ),
    },
    {
      key: "photo",
      label: "Photo",
      renderCell: (item: any) =>
        item.photo ? (
          <img
            src={item.photo}
            alt="Proof"
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          "No Photo"
        ),
    },
    {
      key: "status",
      label: "Status",
      renderCell: (item: any) => (
        <span className="capitalize">{item.status}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      renderCell: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    },
    {
      key: "actions",
      label: "Actions",
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onClick={() => {
              setEditingId(item.id);
              form.edit(item);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onClick={() => deletion.open(item.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden grid px-2">
      <div className="md:w-2xl mx-auto grid grid-rows-[auto_1fr] gap-2 overflow-hidden ">
        <div className="p-1 bg-default-50/30 rounded-xl flex gap-2">
          <div className="flex-1"></div>
          <Button
            color="primary"
            onClick={() => {
              setEditingId(null);
              form.add();
            }}
          >
            Add Deposit
          </Button>
        </div>
        <CustomTable
          columns={columns}
          rows={rows}
          totalRows={data?.pagination?.totalRecords || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          }}
          searchValue={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      </div>
      <Registration form={form} isEditing={!!editingId} />
      <Deletion deletion={deletion} />
    </div>
  );
}

function Registration({
  form,
  isEditing,
}: {
  form: ReturnType<typeof useRegistration>;
  isEditing: boolean;
}) {
  const [search, setSearch] = useState("");
  const filter = useDebouncedCallback((value: string) => setSearch(value), 300);
  const [students, isLoading] = useData(getStudent, () => {}, search);

  // Transform students data to options for react-select
  const studentOptions = useMemo(() => {
    if (!students) return [];

    return students.map((student: any) => ({
      value: student.id,
      label: `${student.firstName} ${student.fatherName} ${student.lastName}`,
      color: "#2684FF", // You can customize this
    }));
  }, [students]);

  // Get the currently selected student
  const selectedStudent = useMemo(() => {
    const studentId = form.watch("studentId");
    return studentOptions.find((option) => option.value === studentId) || null;
  }, [form.watch("studentId"), studentOptions]);

  return (
    <CModal isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
      <Form onSubmit={form.onSubmit} validationErrors={form.validationErrors}>
        <ModalContent>
          {!students ? (
            <Skeleton />
          ) : (
            (onClose) => (
              <>
                <ModalHeader>
                  {isEditing ? "Edit Deposit" : "Add Deposit"}
                </ModalHeader>
                <ModalBody>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Student
                    </label>
                    <Select
                      options={studentOptions}
                      value={selectedStudent}
                      onChange={(selectedOption: StudentOption | null) => {
                        if (selectedOption) {
                          form.setValue("studentId", selectedOption.value);
                        } else {
                          form.setValue("studentId", "");
                        }
                      }}
                      styles={selectStyles}
                      isClearable
                      placeholder="Select a student..."
                      isLoading={isLoading}
                      onInputChange={filter}
                    />
                    {form.validationErrors.studentId && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.validationErrors.studentId}
                      </p>
                    )}
                  </div>
                  <Input
                    label="Amount"
                    type="number"
                    {...form.register("amount")}
                    required
                  />
                  <Input label="Photo URL" {...form.register("photo")} />
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={form.isLoading}
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )
          )}
        </ModalContent>
      </Form>
    </CModal>
  );
}

function Deletion({ deletion }: { deletion: UseDelete }) {
  return (
    <CModal isOpen={deletion.isOpen} onOpenChange={deletion.close}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Delete Deposit</ModalHeader>
            <ModalBody>
              <p className="p-5 text-center ">
                Are you sure you want to{" "}
                <span className="text-danger">delete</span> this deposit?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={deletion.handle}
                isLoading={deletion.isLoading}
              >
                Delete
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}

export default Page;
