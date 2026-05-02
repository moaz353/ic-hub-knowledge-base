import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { codeToHtml } from 'shiki';

const LANG_MAP: Record<string, string> = {
  verilog: 'verilog',
  systemverilog: 'systemverilog',
  tcl: 'tcl',
  python: 'python',
};

const LANG_LABEL: Record<string, string> = {
  verilog: 'Verilog (.v)',
  systemverilog: 'SystemVerilog (.sv)',
  tcl: 'Tcl (.tcl)',
  python: 'Python (.py)',
};

interface Props {
  code: string;
  language: string;
  fileName: string;
}

export default function CodeBlock({ code, language, fileName }: Props) {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code, {
      lang: LANG_MAP[language] || 'text',
      theme: 'dark-plus',
    })
      .then(out => { if (!cancelled) setHtml(out); })
      .catch(() => { if (!cancelled) setHtml(`<pre><code>${escape(code)}</code></pre>`); });
    return () => { cancelled = true; };
  }, [code, language]);

  function escape(s: string) {
    return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c));
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <div className="overflow-hidden">
      {/* File name + language badge OUTSIDE block */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{fileName}</span>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
          {LANG_LABEL[language] || language}
        </span>
      </div>

      {/* Dark code block with only Copy button inside */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-[#1e1e1e]">
        <button
          onClick={copyCode}
          className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm hover:bg-black/60 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <div
          className="overflow-x-auto p-4 text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:!m-0"
          dangerouslySetInnerHTML={{ __html: html || `<pre><code style="color:#d4d4d4">${escape(code)}</code></pre>` }}
        />
      </div>
    </div>
  );
}
