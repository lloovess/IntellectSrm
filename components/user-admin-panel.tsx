'use client';

import { FormEvent, useEffect, useState } from 'react';
import { roleLabels, Role } from '@/lib/rbac';

type ManagedUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  role: Role;
  roleLabel: string;
};

const roles = Object.keys(roleLabels) as Role[];

export default function UserAdminPanel() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('assistant');

  const loadUsers = async () => {
    setLoading(true);
    const response = await fetch('/api/admin/users', { cache: 'no-store' });
    const payload = (await response.json().catch(() => ({}))) as { data?: ManagedUser[]; error?: string };
    if (!response.ok) {
      setMessage({ type: 'error', text: payload.error ?? 'Не удалось загрузить пользователей' });
      setLoading(false);
      return;
    }
    setUsers(payload.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ type: 'error', text: payload.error ?? 'Не удалось создать пользователя' });
        return;
      }
      setEmail('');
      setPassword('');
      setRole('assistant');
      setMessage({ type: 'ok', text: 'Аккаунт создан' });
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (userId: string, nextRole: Role) => {
    setMessage(null);
    setSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ type: 'error', text: payload.error ?? 'Не удалось обновить роль' });
        return;
      }
      setMessage({ type: 'ok', text: 'Роль обновлена' });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: nextRole, roleLabel: roleLabels[nextRole] } : user)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h1>Управление пользователями</h1>
      <p className="small">Только администратор: создание учетных записей и выдача ролей.</p>

      <form className="card" onSubmit={createUser} style={{ marginTop: 12 }}>
        <p className="small">Создать новый аккаунт</p>
        <div className="form-grid" style={{ marginTop: 10 }}>
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Временный пароль
            <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label>
            Роль
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {roleLabels[item]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <button type="submit" className="primary" disabled={saving}>
            Создать аккаунт
          </button>
        </div>
      </form>

      {message ? (
        <div className="card" style={{ marginTop: 10, borderColor: message.type === 'error' ? '#fecaca' : '#99f6e4' }}>
          <p className="small" style={{ color: message.type === 'error' ? '#991b1b' : '#115e59' }}>
            {message.text}
          </p>
        </div>
      ) : null}

      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Создан</th>
              <th>Последний вход</th>
              <th>Роль</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Загрузка...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5}>Пользователи не найдены</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{new Date(user.createdAt).toLocaleString('ru-RU')}</td>
                  <td>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString('ru-RU') : '—'}</td>
                  <td>
                    <select value={user.role} onChange={(e) => void updateRole(user.id, e.target.value as Role)} disabled={saving}>
                      {roles.map((item) => (
                        <option key={item} value={item}>
                          {roleLabels[item]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{user.roleLabel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
