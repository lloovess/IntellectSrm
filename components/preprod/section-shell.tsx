import { ReactNode } from 'react';

type SectionShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function SectionShell({ title, subtitle, actions, children }: SectionShellProps) {
  return (
    <section className="pp-section-shell">
      <div className="pp-section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle ? <p className="small">{subtitle}</p> : null}
        </div>
        {actions ? <div className="pp-section-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
