import { useState } from 'react';

export default function DashboardLayout({ sidebar, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-full flex bg-slate-50">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`h-full overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${sidebarOpen ? 'w-[420px]' : 'w-0'}`}>
        {sidebar}
      </div>

      {/* Toggle arrow */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex items-center justify-center w-6 cursor-pointer shrink-0 bg-white hover:bg-slate-50 border-l border-r border-slate-100 transition-colors group"
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <svg
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto main-scroll bg-slate-50">
        {children}
      </main>
    </div>
  );
}
