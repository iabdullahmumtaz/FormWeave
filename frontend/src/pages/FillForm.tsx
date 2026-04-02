import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { forms as formsApi, submit as submitApi } from '../api';
import type { ConditionalLogic, Form, FormAnswers, FormField } from '../types';

function evaluateCondition(logic: ConditionalLogic | null | undefined, answers: FormAnswers): boolean {
  if (!logic?.fieldId) return true;
  const val = answers[logic.fieldId];
  const target = logic.value;
  switch (logic.operator) {
    case 'equals':
      return String(val) === String(target);
    case 'not_equals':
      return String(val) !== String(target);
    case 'contains':
      return String(val || '').includes(String(target));
    case 'is_empty':
      return val == null || val === '' || (Array.isArray(val) && !val.length);
    case 'is_not_empty':
      return val != null && val !== '' && !(Array.isArray(val) && !val.length);
    default:
      return true;
  }
}

interface FieldInputProps {
  field: FormField;
  value: FormAnswers[string];
  onChange: (value: string | string[]) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const common = {
    value: (value as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(e.target.value),
    placeholder: field.placeholder || 'Type your answer…',
    style: { width: '100%', fontSize: '1.1rem', padding: '0.75rem 0', border: 'none', borderBottom: '2px solid var(--border)', background: 'transparent' },
  };

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'Type your answer…'}
          style={{ width: '100%', fontSize: '1.1rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}
        />
      );
    case 'select':
      return (
        <select {...common} value={value ?? ''}>
          <option value="">Choose…</option>
          {(field.options || []).map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {(field.options || []).map((opt: string) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name={field.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {(field.options || []).map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt);
            return (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    onChange(
                      e.target.checked ? [...current, opt] : current.filter((v) => v !== opt)
                    );
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    case 'email':
      return <input type="email" {...common} autoFocus />;
    case 'number':
      return <input type="number" {...common} autoFocus />;
    case 'text':
    default:
      return <input type="text" {...common} autoFocus />;
  }
}

export default function FillForm() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    formsApi.getBySlug(slug).then(setForm).catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [slug]);

  const visibleFields = useMemo(
    () => (form?.fields || []).filter((f) => evaluateCondition(f.conditionalLogic, answers)),
    [form, answers]
  );

  const current = visibleFields[step];
  const progress = visibleFields.length ? ((step + (done ? 1 : 0)) / visibleFields.length) * 100 : 0;

  function setAnswer(fieldId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  function isEmpty(field: FormField) {
    const v = answers[field.id];
    return v == null || v === '' || (Array.isArray(v) && !v.length);
  }

  async function next() {
    if (!current) return;
    if (current.required && isEmpty(current)) {
      setError(`"${current.label}" is required`);
      return;
    }
    setError('');
    if (step >= visibleFields.length - 1) {
      setSubmitting(true);
      try {
        await submitApi.send(form!._id, answers);
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Submit failed');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => s + 1);
  }

  function prev() {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  }

  if (error && !form) {
    return (
      <div className="fill-screen">
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="fill-screen">
        <p style={{ color: 'var(--muted)' }}>Loading form…</p>
      </div>
    );
  }

  return (
    <div className="fill-screen">
      <div className="fill-card">
        <div className="progress">
          <span style={{ width: `${Math.min(100, progress)}%` }} />
        </div>

        {done ? (
          <div>
            <h1>Thank you!</h1>
            <p style={{ color: 'var(--muted)' }}>Your response has been recorded.</p>
          </div>
        ) : (
          <>
            {form.description && step === 0 && (
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{form.description}</p>
            )}
            {current ? (
              <>
                <h1>{current.label}{current.required ? ' *' : ''}</h1>
                <FieldInput
                  field={current}
                  value={answers[current.id]}
                  onChange={(v) => setAnswer(current.id, v)}
                />
                {error && <p style={{ color: '#b91c1c', marginTop: '1rem' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                  {step > 0 && (
                    <button type="button" className="secondary" onClick={prev}>
                      Back
                    </button>
                  )}
                  <button type="button" onClick={next} disabled={submitting}>
                    {step >= visibleFields.length - 1 ? (submitting ? 'Submitting…' : 'Submit') : 'Continue'}
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>No questions to display.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
