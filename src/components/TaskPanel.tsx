import { useId, useState, type ReactNode } from "react";
import { ChevronIcon } from "./icons";

interface TaskPanelProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** A collapsible section of the blue Explorer-style task pane */
export const TaskPanel = ({ title, children, defaultOpen = true }: TaskPanelProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section>
      <button
        type="button"
        className="xp-panel__header"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        {title}
        <span className="xp-panel__chevron">
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && (
        <div id={bodyId} className="xp-panel__body">
          {children}
        </div>
      )}
    </section>
  );
};
