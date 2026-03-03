export type MutationState = { status: boolean; message: string };

export type Filter = {
  search: string;
  currentPage: number;
  row: number;
  sort: boolean;
  status?: string;
};

export type TAttendance = [
  string,
  Record<
    "morning" | "afternoon",
    { time: string; lateMinute: number } | undefined
  >
];
