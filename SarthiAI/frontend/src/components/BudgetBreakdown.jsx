export default function BudgetBreakdown({ budget }) {
  if (!budget || !budget.breakdown) return null;

  const { total, currency, breakdown, saving_tips } = budget;
  const categories = [
    { key: 'accommodation', label: 'Accommodation', icon: '🏨', color: 'bg-indigo-500' },
    { key: 'food', label: 'Food', icon: '🍜', color: 'bg-orange-500' },
    { key: 'activities', label: 'Activities', icon: '🎭', color: 'bg-emerald-500' },
    { key: 'transport', label: 'Transport', icon: '🚌', color: 'bg-sky-500' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-xs">💰</div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Budget Breakdown</h3>
          <p className="text-[11px] text-slate-400">Agent: Budget Planner</p>
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="text-2xl font-bold text-slate-800">{currency}{total}</span>
        <span className="text-xs text-slate-400">total budget</span>
      </div>

      <div className="space-y-3 mb-4">
        {categories.map(cat => {
          const item = breakdown[cat.key];
          if (!item) return null;
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-600">{cat.icon} {cat.label}</span>
                <span className="font-semibold text-slate-800">{currency}{item.amount} ({item.percentage}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${cat.color} transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
              </div>
              {item.tip && <p className="text-[10px] text-slate-400 mt-0.5">{item.tip}</p>}
            </div>
          );
        })}
      </div>

      {saving_tips?.length > 0 && (
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-[11px] font-semibold text-emerald-700 mb-1.5">Saving Tips</p>
          <ul className="space-y-1">
            {saving_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-600">
                <span className="text-xs mt-0.5">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
