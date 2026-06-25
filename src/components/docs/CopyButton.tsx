'use client';

import { useState } from 'react';

/** Small copy-to-clipboard button used in code-block headers. */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
