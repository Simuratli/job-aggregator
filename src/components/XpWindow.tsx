import type { ReactNode } from "react";
import { CloseGlyph, MaximizeGlyph, MinimizeGlyph, RadarIcon } from "./icons";

interface XpWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/** The window frame. The caption buttons are decoration only, so they are hidden from assistive tech */
export const XpWindow = ({ title, children, className = "" }: XpWindowProps) => (
  <div className={`xp-window ${className}`}>
    <div className="xp-titlebar">
      <RadarIcon />
      <h1 className="min-w-0 flex-1 truncate">{title}</h1>
      <div className="flex gap-0.5" aria-hidden>
        <span className="xp-caption-button">
          <MinimizeGlyph />
        </span>
        <span className="xp-caption-button">
          <MaximizeGlyph />
        </span>
        <span className="xp-caption-button xp-caption-button--close">
          <CloseGlyph />
        </span>
      </div>
    </div>
    {children}
  </div>
);
