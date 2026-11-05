"use client";

import { useState } from "react";

export function BriefActions({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const area = document.createElement("textarea");
      area.value = markdown;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-line bg-sheet px-3 py-1.5 text-sm text-ink hover:border-pine"
      >
        {copied ? "Copied" : "Copy markdown"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-line bg-sheet px-3 py-1.5 text-sm text-ink hover:border-pine"
      >
        Print
      </button>
    </div>
  );
}
