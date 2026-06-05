export type JobStatus =
  | "wishlist"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export const JOB_STATUSES: JobStatus[] = [
  "wishlist",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

export const STATUS_LABELS: Record<JobStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export type KitData = {
  coverLetter: string;
  resumeBullets: string[];
  interviewQuestions: string[];
  companyBrief: string;
  generatedAt: string;
};

export type Job = {
  id: string;
  user_id: string;
  title: string;
  company: string;
  url: string | null;
  description: string;
  status: JobStatus;
  sort_order: number;
  kit: KitData | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  full_name: string | null;
  resume_text: string;
  updated_at: string;
};
