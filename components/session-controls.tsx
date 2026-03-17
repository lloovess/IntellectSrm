'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { roleLabels, Role } from '@/lib/rbac';

type Props = {
  role: Role;
  email: string | null;
};

export default function SessionControls({ role, email }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-controls">
      <p className="small">{email ?? 'Пользователь'}</p>
      <p className="small">Роль: {roleLabels[role]}</p>
      <button type="button" onClick={() => void logout()} disabled={loading}>
        Выйти
      </button>
    </div>
  );
}
