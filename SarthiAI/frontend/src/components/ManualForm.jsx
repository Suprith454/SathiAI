const INTERESTS = [
  { label: 'Food', icon: '🍜' },
  { label: 'History', icon: '🏛️' },
  { label: 'Adventure', icon: '🧗' },
  { label: 'Culture', icon: '🎭' },
  { label: 'Nature', icon: '🌿' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Nightlife', icon: '🌃' },
];

const BUDGETS = [
  { value: 'low', label: 'Low', icon: '💵', desc: 'Budget-friendly' },
  { value: 'medium', label: 'Medium', icon: '💰', desc: 'Balanced' },
  { value: 'high', label: 'High', icon: '💎', desc: 'Premium' },
];

export default function ManualForm({ form, onChange, onGenerate, loading }) {
  const toggleInterest = (label) => {
    onChange({
      ...form,
      interests: form.interests.includes(label)
        ? form.interests.filter((i) => i !== label)
        : [...form.interests, label],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.destination.trim()) return;
    onGenerate({
      destination: form.destination.trim(),
      duration: form.duration,
      budget: form.budget,
      interests: form.interests,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/10 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 px-8 pt-8 pb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">✈️</span>
            <h2 className="text-xl font-bold text-white">Plan Your Trip</h2>
          </div>
          <p className="text-indigo-200 text-sm">Fill in the details and we'll create a custom itinerary.</p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Destination */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5 uppercase tracking-wider">Destination</label>
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 opacity-0 group-focus-within:opacity-100 transition-opacity -m-0.5" />
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 group-focus-within:border-indigo-400 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20 transition-all">
              <span className="text-lg mr-3">📍</span>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => onChange({ ...form, destination: e.target.value })}
                placeholder="e.g. Tokyo, Paris, Bali..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5 uppercase tracking-wider">Travel Dates</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <label className="text-[11px] text-slate-400 font-medium block mb-1">From</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = form.endDate && form.endDate < start ? '' : form.endDate;
                  const dur = end && start ? Math.max(1, Math.round((new Date(end) - new Date(start)) / (1000*60*60*24)) + 1) : 1;
                  onChange({ ...form, startDate: start, endDate: end, duration: dur });
                }}
                className="w-full bg-transparent text-sm text-slate-800 outline-none [color-scheme:light]"
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <label className="text-[11px] text-slate-400 font-medium block mb-1">To</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => {
                  const end = e.target.value;
                  const dur = form.startDate && end ? Math.max(1, Math.round((new Date(end) - new Date(form.startDate)) / (1000*60*60*24)) + 1) : 1;
                  onChange({ ...form, endDate: end, duration: dur });
                }}
                className="w-full bg-transparent text-sm text-slate-800 outline-none [color-scheme:light]"
              />
            </div>
          </div>
          {form.startDate && form.endDate && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{form.duration} day{form.duration > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Budget */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-2 uppercase tracking-wider">Budget</label>
          <div className="grid grid-cols-3 gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => onChange({ ...form, budget: b.value })}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                  form.budget === b.value
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm shadow-indigo-200/50 scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm hover:shadow-slate-200/50'
                }`}
              >
                <span className="text-xl">{b.icon}</span>
                <span className="font-semibold">{b.label}</span>
                <span className="text-[10px] text-slate-400">{b.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-2 uppercase tracking-wider">Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(({ label, icon }) => {
              const active = form.interests.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleInterest(label)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm shadow-indigo-200/50'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                  {active && (
                    <svg className="w-3 h-3 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer
            bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white
            hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700
            hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5
            disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
            shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Generate Itinerary
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
