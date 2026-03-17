'use client';

import { FormEvent, useEffect, useState } from 'react';

type Branch = { id: string; name: string };

export default function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const loadBranches = async () => {
    setLoading(true);
    const response = await fetch('/api/branches', { cache: 'no-store' });
    const payload = (await response.json().catch(() => ({}))) as { data?: Branch[]; error?: string };
    if (!response.ok) {
      setMessage({ type: 'error', text: payload.error ?? 'Не удалось загрузить филиалы' });
      setLoading(false);
      return;
    }
    setBranches(payload.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadBranches();
  }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ type: 'error', text: payload.error ?? 'Не удалось создать филиал' });
        return;
      }
      setName('');
      setMessage({ type: 'ok', text: 'Филиал создан' });
      await loadBranches();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <p className="small">Филиалы</p>
      <form onSubmit={create}>
        <div className="actions">
          <input placeholder="Название филиала" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="primary" disabled={saving || !name.trim()}>
            Создать филиал
          </button>
        </div>
      </form>

      {message ? (
        <p className="small" style={{ marginTop: 10, color: message.type === 'error' ? '#991b1b' : '#115e59' }}>
          {message.text}
        </p>
      ) : null}

      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2}>Загрузка...</td>
              </tr>
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={2}>Филиалов пока нет</td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id}>
                  <td>{branch.name}</td>
                  <td>{branch.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
