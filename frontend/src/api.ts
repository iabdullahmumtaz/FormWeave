import type { Form, FormAnswers } from './types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

export const forms = {
  list: () => request<Form[]>('/forms'),
  get: (id: string) => request<Form>(`/forms/${id}`),
  getBySlug: (slug: string) => request<Form>(`/forms/slug/${slug}`),
  create: (body: Partial<Form>) =>
    request<Form>('/forms', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Form>) =>
    request<Form>(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) => request<{ ok: boolean }>(`/forms/${id}`, { method: 'DELETE' }),
};

export const submit = {
  send: (formId: string, answers: FormAnswers) =>
    request<{ ok: boolean; id: string }>(`/submit/${formId}`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
};

export const analytics = {
  get: (formId: string) => request<import('./types').AnalyticsData>(`/analytics/${formId}`),
};
