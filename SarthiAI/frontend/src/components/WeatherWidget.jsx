const ICONS = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
};

function iconFor(condition) {
  return ICONS[condition] || '🌤️';
}

export default function WeatherWidget({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-4 text-sm mb-8">
      <div className="flex items-center gap-2 font-medium text-sky-700 mb-3">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        Weather Forecast
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.map((w, i) => (
          <div key={i} className="shrink-0 flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-sky-50 text-xs text-slate-600 shadow-sm">
            <span className="font-medium text-sky-600">{w.date}</span>
            <span>{iconFor(w.condition)}</span>
            <span className="font-semibold text-slate-700">{w.temp}°C</span>
            <span className="text-slate-400">{w.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
