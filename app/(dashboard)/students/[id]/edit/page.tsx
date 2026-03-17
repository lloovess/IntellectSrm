'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Student } from '@/lib/domain';

type Props = { params: Promise<{ id: string }> };

export default function EditStudentPage({ params }: Props) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const { id } = await params;
      setStudentId(id);

      const response = await fetch(`/api/students/${id}`, { cache: 'no-store' });
      if (!response.ok) {
        setError('Ученик не найден');
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as { data: Student };
      setFullName(payload.data.fullName);
      setPhone(payload.data.phone);
      setLoading(false);
    };

    void load();
  }, [params]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!studentId) return;

    setSaving(true);
    setError('');

    const response = await fetch(`/api/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone })
    });

    if (!response.ok) {
      setError('Не удалось сохранить изменения');
      setSaving(false);
      return;
    }

    router.push('/students');
    router.refresh();
  };

  return (
    <section>
      <h1>Редактирование ученика</h1>
      {loading ? (
        <p className="small">Загрузка...</p>
      ) : (
        <form className="card" onSubmit={handleSubmit}>
          <p className="small">ФИО</p>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', padding: 8 }} />

          <p className="small" style={{ marginTop: 12 }}>
            Телефон
          </p>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: 8 }} />

          {error ? (
            <p className="small" style={{ color: '#b91c1c', marginTop: 10 }}>
              {error}
            </p>
          ) : null}

          <div className="actions">
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
