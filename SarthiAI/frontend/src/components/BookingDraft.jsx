import { useState } from 'react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
    >
      {copied ? (
        <>✓ Copied</>
      ) : (
        <>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function BookingDraft({ emails }) {
  const [expanded, setExpanded] = useState(null);
  if (!emails?.length) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs">📧</div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Booking Drafts</h3>
          <p className="text-[11px] text-slate-400">Agent: Booking Assistant</p>
        </div>
      </div>

      <div className="space-y-3">
        {emails.map((email, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${email.type === 'hotel' ? 'bg-rose-50 text-rose-500' : 'bg-purple-50 text-purple-500'}`}>
                  {email.type === 'hotel' ? '🏨' : '🎫'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{email.subject}</p>
                  <p className="text-[11px] text-slate-400">To: {email.to}</p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded === idx ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expanded === idx && (
              <div className="px-4 pb-4 border-t border-slate-50">
                <div className="flex items-center justify-between mt-3 mb-2">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Email Body</span>
                  <CopyButton text={email.body} />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
                  {email.body}
                </div>
                {email.notes && (
                  <div className="flex items-start gap-1.5 mt-2 text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs">💡</span>
                    <span>{email.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
