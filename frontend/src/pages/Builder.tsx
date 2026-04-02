import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { forms as api } from '../api';
import type { FieldType, Form, FormField } from '../types';

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'email', label: 'Email' },
  { type: 'number', label: 'Number' },
  { type: 'textarea', label: 'Long text' },
  { type: 'select', label: 'Dropdown' },
  { type: 'radio', label: 'Radio' },
  { type: 'checkbox', label: 'Checkbox' },
];

function newField(type: FieldType): FormField {
  const base: FormField = {
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: 'New question',
    required: false,
    placeholder: '',
    conditionalLogic: null,
  };
  if (['select', 'radio', 'checkbox'].includes(type)) {
    return { ...base, options: ['Option 1', 'Option 2'] };
  }
  return base;
}

interface SortableFieldCardProps {
  field: FormField;
  selected: boolean;
  onSelect: () => void;
}

function SortableFieldCard({ field, selected, onSelect }: SortableFieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`field-card${selected ? ' selected' : ''}`}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <strong>{field.label}</strong>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{field.type}</span>
      </div>
      {field.required && <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Required</span>}
    </div>
  );
}

interface PaletteItemProps {
  type: FieldType;
  label: string;
  onAdd: (type: FieldType) => void;
}

function PaletteItem({ type, label, onAdd }: PaletteItemProps) {
  return (
    <button
      type="button"
      className="palette-item"
      onClick={() => onAdd(type)}
    >
      {label}
    </button>
  );
}

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logicJson, setLogicJson] = useState('');

  const selected = fields.find((f) => f.id === selectedId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const load = useCallback(() => {
    if (!id) return;
    api.get(id).then((data) => {
      setForm(data);
      setFields(data.fields || []);
      if (data.fields?.length) setSelectedId(data.fields[0].id);
    }).catch(() => navigate('/'));
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selected) {
      setLogicJson(
        selected.conditionalLogic ? JSON.stringify(selected.conditionalLogic, null, 2) : ''
      );
    } else {
      setLogicJson('');
    }
  }, [selectedId, selected?.conditionalLogic]);

  async function save(nextPublished = form?.published) {
    if (!form || !id) return;
    setSaving(true);
    try {
      const updated = await api.update(id, {
        title: form.title,
        description: form.description,
        fields,
        published: nextPublished,
      });
      setForm(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function updateField(fieldId: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)));
  }

  function removeField(fieldId: string) {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedId === fieldId) setSelectedId(null);
  }

  function insertField(type: FieldType, index = fields.length) {
    const field = newField(type);
    setFields((prev) => {
      const next = [...prev];
      next.splice(index, 0, field);
      return next;
    });
    setSelectedId(field.id);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function applyLogicJson() {
    if (!selected) return;
    if (!logicJson.trim()) {
      updateField(selected.id, { conditionalLogic: null });
      return;
    }
    try {
      updateField(selected.id, { conditionalLogic: JSON.parse(logicJson) });
    } catch {
      alert('Invalid JSON for conditional logic');
    }
  }

  const activeField = fields.find((f) => f.id === activeId);

  if (!form) return <div className="page"><p style={{ color: 'var(--muted)' }}>Loading…</p></div>;

  return (
    <div>
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <Link to="/" className="logo">FormWeave</Link>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={!!form.published}
              onChange={(e) => {
                const published = e.target.checked;
                setForm((f) => (f ? { ...f, published } : f));
                save(published);
              }}
            />
            Published
          </label>
          <button type="button" onClick={() => save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {form.published && (
            <Link to={`/f/${form.slug}`} target="_blank">
              <button type="button" className="secondary">Preview ↗</button>
            </Link>
          )}
        </div>
      </div>

      <div style={{ padding: '1rem 2rem 0' }}>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
          style={{ fontSize: '1.5rem', fontWeight: 700, width: '100%', marginBottom: '0.5rem' }}
        />
        <input
          value={form.description || ''}
          onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
          placeholder="Form description"
          style={{ width: '100%', color: 'var(--muted)' }}
        />
      </div>

      <div className="builder-layout">
        <aside className="palette">
          <h4>Fields</h4>
          {FIELD_TYPES.map(({ type, label }) => (
            <PaletteItem key={type} type={type} label={label} onAdd={insertField} />
          ))}
        </aside>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <section className="canvas">
            {!fields.length && (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
                Add fields from the palette or drag to reorder
              </p>
            )}
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  selected={selectedId === field.id}
                  onSelect={() => setSelectedId(field.id)}
                />
              ))}
            </SortableContext>
          </section>
          <DragOverlay>
            {activeField ? (
              <div className="field-card selected">
                <strong>{activeField.label}</strong>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <aside className="inspector">
          <h4 style={{ marginBottom: '0.75rem' }}>Inspector</h4>
          {!selected ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Select a field to edit</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label>
                Label
                <input
                  value={selected.label}
                  onChange={(e) => updateField(selected.id, { label: e.target.value })}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                />
              </label>
              <label>
                Type
                <select
                  value={selected.type}
                  onChange={(e) => {
                    const type = e.target.value as FieldType;
                    const patch: Partial<FormField> = { type };
                    if (['select', 'radio', 'checkbox'].includes(type) && !selected.options?.length) {
                      patch.options = ['Option 1', 'Option 2'];
                    }
                    updateField(selected.id, patch);
                  }}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  {FIELD_TYPES.map(({ type, label }) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Placeholder
                <input
                  value={selected.placeholder || ''}
                  onChange={(e) => updateField(selected.id, { placeholder: e.target.value })}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  checked={!!selected.required}
                  onChange={(e) => updateField(selected.id, { required: e.target.checked })}
                />
                Required
              </label>
              {['select', 'radio', 'checkbox'].includes(selected.type) && (
                <label>
                  Options (one per line)
                  <textarea
                    rows={4}
                    value={(selected.options || []).join('\n')}
                    onChange={(e) =>
                      updateField(selected.id, {
                        options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </label>
              )}
              <label>
                Conditional logic (JSON)
                <textarea
                  rows={6}
                  value={logicJson}
                  onChange={(e) => setLogicJson(e.target.value)}
                  placeholder='{"fieldId":"f1","operator":"equals","value":"Yes"}'
                  style={{ width: '100%', marginTop: '0.25rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </label>
              <button type="button" className="secondary" onClick={applyLogicJson}>
                Apply logic JSON
              </button>
              <button type="button" className="ghost" onClick={() => removeField(selected.id)}>
                Delete field
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
