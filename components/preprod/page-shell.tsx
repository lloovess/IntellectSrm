import { ReactNode } from 'react';

type PageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <section className="pp-page-shell">
      <div className="pp-page-head">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p className="small">{subtitle}</p> : null}
        </div>
        {actions ? <div className="pp-page-actions">{actions}</div> : null}
      </div>
      <div className="pp-page-content">{children}</div>
    </section>
  );
}
