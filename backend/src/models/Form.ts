import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox'],
      required: true,
    },
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    placeholder: { type: String, default: '' },
    conditionalLogic: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    slug: { type: String, required: true, unique: true, lowercase: true },
    fields: [fieldSchema],
    published: { type: Boolean, default: false },
    theme: { type: String, default: 'purple' },
  },
  { timestamps: true }
);

export default mongoose.model('Form', formSchema);
