import { Router } from 'express';
import Form from '../models/Form.js';
import Submission from '../models/Submission.js';

const router = Router();

interface ConditionalLogic {
  fieldId?: string;
  operator?: string;
  value?: unknown;
}

function evaluateCondition(
  logic: ConditionalLogic | null | undefined,
  answers: Record<string, unknown>
): boolean {
  if (!logic?.fieldId) return true;
  const val = answers[logic.fieldId];
  const target = logic.value;
  switch (logic.operator) {
    case 'equals': return String(val) === String(target);
    case 'not_equals': return String(val) !== String(target);
    case 'contains': return String(val || '').includes(String(target));
    case 'is_empty': return val == null || val === '' || (Array.isArray(val) && !val.length);
    case 'is_not_empty': return val != null && val !== '' && !(Array.isArray(val) && !val.length);
    default: return true;
  }
}

router.post('/:formId', async (req, res) => {
  const form = await Form.findById(req.params.formId);
  if (!form?.published) return res.status(404).json({ error: 'Form not available' });

  const answers: Record<string, unknown> = req.body.answers || {};
  const visible = form.fields.filter((f) => evaluateCondition(f.conditionalLogic as ConditionalLogic, answers));

  for (const field of visible) {
    if (field.required) {
      const v = answers[field.id];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) {
        return res.status(400).json({ error: `"${field.label}" is required` });
      }
    }
  }

  const submission = await Submission.create({
    form: form._id,
    answers,
    meta: { userAgent: req.headers['user-agent'] },
  });
  res.status(201).json({ ok: true, id: submission._id });
});

export default router;
