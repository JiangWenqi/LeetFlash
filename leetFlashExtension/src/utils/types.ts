export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://leetflash.com"
    : "http://localhost:3030";
export const VERIFY_URL = `${BASE_URL}/api/auth/verify-api-token`;
export const SEND_QUESTION_API = `${BASE_URL}/api/user/add-question/`;
export const SEND_NOTE_API = `${BASE_URL}/api/user/add-note/`;
export const LEETFLASH_DASHBOARD = "https://leetflash.com/dashboard";

export interface TopicTag {
  name: string;
  translatedName: string;
}

export interface SubmissionQuestion {
  questionId: string;

  title: string;
  translatedTitle?: string;

  titleSlug: string;
  topicTags: TopicTag[];
  difficulty: string;

  content: string;
  translatedContent?: string;
}

export interface SubmissionDetail {
  code?: string;
  id: string;
  lang: string;
  rawMemory?: string;
  memory?: string;
  question: SubmissionQuestion;
  runtime: string;
  sourceUrl?: string;
  statusDisplay: string;
  timestamp: number;
}

export interface checkResult {
  lang: string;
  status_runtime: string;
  status_msg: string;
}

export interface Reminder {
  titleSlug: string;
  title: string;
  translatedTitle?: string;
  next_rep_date: string;
}

export interface Note {
  note: string;
  questionId: string;
}
