import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { analytics as analyticsApi } from '../api';
import type { AnalyticsData } from '../types';

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    analyticsApi.get(id).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <p style={{ color: '#b91c1c' }}>{error}</p>
        <Link to="/">← Back</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <p style={{ color: 'var(--muted)' }}>Loading analytics…</p>
      </div>
    );
  }

  const { form, total, fieldStats = [], timeline = [], recent = [] } = data;
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="page">
      <Link to="/" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>← Your forms</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '1rem 0 2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{form?.title || 'Analytics'}</h1>
          <p style={{ color: 'var(--muted)' }}>{total} total submissions</p>
        </div>
        <Link to={`/builder/${id}`}>
          <button type="button" className="secondary">Edit form</button>
        </Link>
      </div>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Submissions over time</h3>
        {timeline.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No submissions yet.</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '160px' }}>
            {timeline.map((point) => (
              <div key={point.date} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  title={`${point.date}: ${point.count}`}
                  style={{
                    height: `${(point.count / maxCount) * 120}px`,
                    minHeight: point.count ? '4px' : 0,
                    background: 'var(--accent)',
                    borderRadius: '4px 4px 0 0',
                    margin: '0 auto',
                    maxWidth: '48px',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginTop: '0.35rem' }}>
                  {point.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Field stats</h3>
        <div className="form-grid">
          {fieldStats.map((stat) => (
            <div key={stat.fieldId} className="card">
              <h4 style={{ marginBottom: '0.35rem' }}>{stat.label}</h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {stat.type} · {stat.responses} responses
              </p>
              {stat.counts && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {Object.entries(stat.counts).map(([option, count]) => (
                    <li key={option} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.2rem 0' }}>
                      <span>{option}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {stat.average != null && stat.type === 'number' && (
                <p>Average: <strong>{stat.average.toFixed(2)}</strong></p>
              )}
              {stat.samples && stat.samples.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Sample answers</p>
                  {stat.samples.map((sample, i) => (
                    <p key={i} style={{ fontSize: '0.85rem', margin: '0.15rem 0' }}>{String(sample)}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!fieldStats.length && <p style={{ color: 'var(--muted)' }}>No field data yet.</p>}
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginBottom: '1rem' }}>Recent submissions</h3>
        {recent.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No submissions yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recent.map((sub) => (
              <li
                key={sub.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--muted)' }}>
                    {new Date(sub.createdAt).toLocaleString()}
                  </span>
                  <span>{Object.keys(sub.answers || {}).length} answers</span>
                </div>
                <pre style={{ fontSize: '0.75rem', overflow: 'auto', margin: 0, color: 'var(--muted)' }}>
                  {JSON.stringify(sub.answers, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
