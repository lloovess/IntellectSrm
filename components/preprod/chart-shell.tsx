import { ReactNode } from 'react';

type ChartShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export default function ChartShell({ title, subtitle, children }: ChartShellProps) {
  return (
    <section className="card pp-chart-shell">
      <div className="pp-chart-head">
        <p className="small">{title}</p>
        {subtitle ? <p className="small pp-chart-subtitle">{subtitle}</p> : null}
      </div>
      <div className="pp-chart-body">{children ?? <div className="pp-chart-placeholder">Chart area slot</div>}</div>
    </section>
  );
}
