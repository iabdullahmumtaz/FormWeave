import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import formRoutes from './routes/forms.js';
import submissionRoutes from './routes/submissions.js';
import analyticsRoutes from './routes/analytics.js';
import Form from './models/Form.js';

const app = express();
const PORT = process.env.PORT || 6025;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/formweave';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5025' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'FormWeave' }));
app.use('/api/forms', formRoutes);
app.use('/api/submit', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);

async function seed() {
  const existing = await Form.findOne({ slug: 'customer-feedback-demo' });
  if (existing) return;

  await Form.create({
    title: 'Customer Feedback',
    description: 'Help us improve your experience',
    slug: 'customer-feedback-demo',
    published: true,
    theme: 'purple',
    fields: [
      { id: 'f1', type: 'text', label: 'Your name', required: true },
      { id: 'f2', type: 'email', label: 'Email address', required: true },
      {
        id: 'f3',
        type: 'radio',
        label: 'How satisfied are you?',
        required: true,
        options: ['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'],
      },
      {
        id: 'f4',
        type: 'textarea',
        label: 'What could we improve?',
        required: false,
        conditionalLogic: {
          fieldId: 'f3',
          operator: 'not_equals',
          value: 'Very satisfied',
        },
      },
    ],
  });
  console.log('[Seed] Demo form created');
}

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('[MongoDB] Connected');
  await seed();
  app.listen(PORT, () => console.log(`FormWeave API on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
