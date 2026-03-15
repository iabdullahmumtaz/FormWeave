import { Router } from 'express';
import Submission from '../models/Submission.js';
import Form from '../models/Form.js';

const router = Router();

router.get('/:formId', async (req, res) => {
  const form = await Form.findById(req.params.formId);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  const submissions = await Submission.find({ form: form._id }).sort({ createdAt: -1 });
  const fieldStats = form.fields.map((field) => {
    const values = submissions
      .map((s) => (s.answers as Record<string, unknown>)?.[field.id])
      .filter((v) => v != null && v !== '');
    if (['select', 'radio', 'checkbox'].includes(field.type)) {
      const counts: Record<string, number> = {};
      values.forEach((v) => {
        (Array.isArray(v) ? v : [v]).forEach((item) => {
          const key = String(item);
          counts[key] = (counts[key] || 0) + 1;
        });
      });
      return { fieldId: field.id, label: field.label, type: field.type, counts, responses: values.length };
    }
    if (field.type === 'number') {
      const nums = values.map(Number).filter((n) => !Number.isNaN(n));
      return {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        average: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0,
        responses: values.length,
      };
    }
    return {
      fieldId: field.id,
      label: field.label,
      type: field.type,
      responses: values.length,
      samples: values.slice(0, 5),
    };
  });

  const timeline = await Submission.aggregate([
    { $match: { form: form._id } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    form: { id: form._id, title: form.title, slug: form.slug },
    total: submissions.length,
    fieldStats,
    timeline: timeline.map((t: { _id: string; count: number }) => ({ date: t._id, count: t.count })),
    recent: submissions.slice(0, 10).map((s) => ({
      id: s._id,
      createdAt: s.createdAt,
      answers: s.answers,
    })),
  });
});

export default router;
