import { ReactNode } from 'react';

type ActionStepShellProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export default function ActionStepShell({ title, hint, children }: ActionStepShellProps) {
  return (
    <section className="card pp-step-shell" style={{ marginTop: 12 }}>
      <div className="pp-step-head">
        <p className="small">{title}</p>
        {hint ? <p className="small pp-step-hint">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
