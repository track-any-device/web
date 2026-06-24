'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/* Shared inter-page content transition.

   Wraps page CONTENT (never the chrome) in a motion.div that animates in on mount: a gentle
   fade + ~8px upward slide. Used both by the marketing <main> (SiteShell re-mounts per nav, so
   a mount enter-animation is enough) and by the portal templates (which re-mount on every
   in-segment navigation while the sidebar/header/footer stay mounted).

   Layout-transparency: the wrapper is a flex column that grows to fill its parent
   (`flex: 1; min-height: 0`) and never clips, so the full-bleed /my map pages — which manage
   their own height inside this wrapper — keep filling the viewport. With nothing to animate
   (reduced motion) it renders a plain div so there's zero transform/opacity left on the node. */

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const ENTER = { opacity: 0, y: 8 };
const SETTLED = { opacity: 1, y: 0 };

// A flex column that grows to fill its parent and never constrains/clips a full-bleed child.
const FILL_STYLE: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className} style={FILL_STYLE}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={FILL_STYLE}
      initial={ENTER}
      animate={SETTLED}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
