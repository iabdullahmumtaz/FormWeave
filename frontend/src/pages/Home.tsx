import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forms as api } from '../api';
import type { Form } from '../types';

export default function Home() {
  const [list, setList] = useState<Form[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.list().then(setList).catch(console.error);
  }, []);

  async function createNew() {
    const form = await api.create({ title: 'Untitled Form', fields: [], published: false });
    navigate(`/builder/${form._id}`);
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Your forms</h1>
        <button type="button" onClick={createNew}>+ New form</button>
      </div>
      <div className="form-grid">
        {list.map((f) => (
          <div key={f._id} className="card">
            <h3>{f.title}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.35rem 0 1rem' }}>
              {f.fields?.length || 0} fields · {f.published ? 'Published' : 'Draft'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to={`/builder/${f._id}`}><button type="button" className="secondary">Edit</button></Link>
              <Link to={`/analytics/${f._id}`}><button type="button" className="secondary">Analytics</button></Link>
              {f.published && (
                <Link to={`/f/${f.slug}`} target="_blank"><button type="button" className="ghost">Preview ↗</button></Link>
              )}
            </div>
          </div>
        ))}
        {!list.length && <p style={{ color: 'var(--muted)' }}>No forms yet. Create your first form.</p>}
      </div>
    </div>
  );
}
