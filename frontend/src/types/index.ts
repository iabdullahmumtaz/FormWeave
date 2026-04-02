export type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'is_empty'
  | 'is_not_empty';

export interface ConditionalLogic {
  fieldId: string;
  operator: ConditionalOperator;
  value?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  conditionalLogic?: ConditionalLogic | null;
}

export interface Form {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  fields: FormField[];
  published: boolean;
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldStat {
  fieldId: string;
  label: string;
  type: FieldType;
  responses: number;
  counts?: Record<string, number>;
  average?: number;
  samples?: unknown[];
}

export interface AnalyticsData {
  form: { id: string; title: string; slug: string };
  total: number;
  fieldStats: FieldStat[];
  timeline: { date: string; count: number }[];
  recent: { id: string; createdAt: string; answers: Record<string, unknown> }[];
}

export type FormAnswers = Record<string, string | number | string[] | undefined>;
