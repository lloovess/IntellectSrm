import { ReactNode } from 'react';

type TableShellProps = {
  children: ReactNode;
};

export default function TableShell({ children }: TableShellProps) {
  return <div className="table-wrap pp-table-shell">{children}</div>;
}
