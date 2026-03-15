import { Router } from 'express';
import { nanoid } from 'nanoid';
import Form from '../models/Form.js';
import { errorMessage } from '../utils/errors.js';

const router = Router();

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${nanoid(6)}`;
}

router.get('/', async (_req, res) => {
  res.json(await Form.find().sort({ updatedAt: -1 }));
});

router.post('/', async (req, res) => {
  try {
    const { title, description, fields, published, theme } = req.body;
    const form = await Form.create({
      title,
      description: description || '',
      slug: slugify(title || 'form'),
      fields: fields || [],
      published: !!published,
      theme,
    });
    res.status(201).json(form);
  } catch (err) {
    res.status(400).json({ error: errorMessage(err) });
  }
});

router.get('/slug/:slug', async (req, res) => {
  const form = await Form.findOne({ slug: req.params.slug, published: true });
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json(form);
});

router.get('/:id', async (req, res) => {
  const form = await Form.findById(req.params.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json(form);
});

router.put('/:id', async (req, res) => {
  const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json(form);
});

router.delete('/:id', async (req, res) => {
  const form = await Form.findByIdAndDelete(req.params.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json({ ok: true });
});

export default router;
