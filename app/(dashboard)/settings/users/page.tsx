import Link from 'next/link';
import UserAdminPanel from '@/components/user-admin-panel';
import { getCurrentSessionFromCookies } from '@/lib/user-role';

export default async function UsersSettingsPage() {
  const session = await getCurrentSessionFromCookies();

  if (session.role !== 'admin') {
    return (
      <section>
        <h1>Управление пользователями</h1>
        <p className="small">Доступ только для администратора.</p>
        <div className="actions" style={{ marginTop: 10 }}>
          <Link href="/" className="btn">
            Вернуться на дашборд
          </Link>
        </div>
      </section>
    );
  }

  return <UserAdminPanel />;
}
