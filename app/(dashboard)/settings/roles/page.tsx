import { permissions, rbacMatrix, roleLabels, type Role } from '@/lib/rbac';
import Link from 'next/link';
import { getCurrentRoleFromCookies } from '@/lib/user-role';
import { redirect } from 'next/navigation';

const roles = Object.keys(roleLabels) as Role[];

export default async function RolesPage() {
  const role = await getCurrentRoleFromCookies();
  if (role !== 'admin') {
    redirect('/');
  }

  return (
    <section>
      <h1>Матрица ролей (RBAC)</h1>
      <p className="small">Базовая модель прав для прототипа. Финальная версия утверждается перед production.</p>
      <div className="actions" style={{ marginTop: 10 }}>
        <Link href="/settings/users" className="btn primary">
          Управление пользователями
        </Link>
      </div>

      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Разрешение</th>
              {roles.map((role) => (
                <th key={role}>{roleLabels[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission}>
                <td>{permission}</td>
                {roles.map((role) => (
                  <td key={role + permission}>{rbacMatrix[role].includes(permission) ? '✓' : '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
