'use client';

import { useState } from 'react';

type ActionOverlaySlotProps = {
  title: string;
  hint?: string;
  primaryLabel?: string;
};

export default function ActionOverlaySlot({ title, hint, primaryLabel = 'Открыть' }: ActionOverlaySlotProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card pp-overlay-slot">
      <p className="small">{title}</p>
      {hint ? <p className="small" style={{ marginTop: 4 }}>{hint}</p> : null}
      <div className="actions" style={{ marginTop: 10 }}>
        <button className="primary" type="button" onClick={() => setOpen(true)}>
          {primaryLabel}
        </button>
      </div>

      {open ? (
        <div className="pp-overlay-backdrop" onClick={() => setOpen(false)}>
          <div className="pp-overlay-card" onClick={(event) => event.stopPropagation()}>
            <p className="small">Drawer/Modal slot for final design</p>
            <p className="small" style={{ marginTop: 6 }}>
              Здесь дизайнер подставит финальный drawer/modal сценарий.
            </p>
            <div className="actions" style={{ marginTop: 12 }}>
              <button type="button" onClick={() => setOpen(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
