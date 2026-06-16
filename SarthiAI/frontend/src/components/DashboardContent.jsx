import { useState } from 'react';
import WeatherWidget from './WeatherWidget';
import PhotoModal from './PhotoModal';
import HeroSlideshow from './HeroSlideshow';
import BudgetBreakdown from './BudgetBreakdown';
import HotelCard from './HotelCard';
import BookingDraft from './BookingDraft';

const BUDGET_LABELS = { low: '💵 Budget', medium: '💰 Mid-Range', high: '💎 Luxury' };

function formatBudget(budget, currency) {
  if (budget == null) return '—';
  if (typeof budget === 'object') {
    return `${budget.currency || currency || '$'}${budget.total}`;
  }
  if (typeof budget === 'number') return `${currency || '$'}${budget}`;
  return BUDGET_LABELS[budget] || budget;
}

export default function DashboardContent({ itinerary, weather, destination, heroPhotos }) {
  const [photoQuery, setPhotoQuery] = useState(null);
  const totalActivities = itinerary?.days?.reduce((sum, d) => sum + (d.activities?.length || 0), 0) || 0;
  const effectiveWeather = weather || itinerary?.weather;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Header Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard
          icon="📍"
          label="Destination"
          value={destination || itinerary?.title || '—'}
          delay={0}
        />
        <StatCard
          icon="📅"
          label="Duration"
          value={itinerary?.days ? `${itinerary.days.length} Days` : '—'}
          delay={100}
        />
        <StatCard
          icon="💰"
          label="Budget"
          value={formatBudget(itinerary?.budget, itinerary?.currency)}
          delay={200}
        />
        <StatCard
          icon="🎯"
          label="Activities"
          value={totalActivities > 0 ? `${totalActivities} Planned` : '—'}
          delay={300}
        />
      </div>

      <HeroSlideshow
        photos={heroPhotos || []}
        destination={destination || itinerary?.title}
        tagline={itinerary?.tagline}
        interval={4000}
      />

      {/* Agent Section: Budget */}
      {itinerary?.budget && typeof itinerary.budget === 'object' && (
        <BudgetBreakdown budget={itinerary.budget} />
      )}

      {/* Agent Section: Weather */}
      <WeatherWidget data={effectiveWeather} />

      {/* Agent Section: Day Cards (Itinerary) */}
      {itinerary?.days && (
        <div className="space-y-6" id="itinerary-content">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white text-xs">📋</div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Day-by-Day Itinerary</h3>
              <p className="text-[11px] text-slate-400">Agent: Itinerary Planner</p>
            </div>
          </div>
          {itinerary.days.map((day, idx) => (
            <DayCard key={idx} day={idx + 1} activities={day.activities} onPhotoClick={setPhotoQuery} />
          ))}
        </div>
      )}

      {/* Agent Section: Hotels */}
      <HotelCard hotels={itinerary?.hotels} currency={itinerary?.currency} />

      {/* Agent Section: Booking Drafts */}
      <BookingDraft emails={itinerary?.booking_emails} />

      {photoQuery && <PhotoModal query={photoQuery} onClose={() => setPhotoQuery(null)} />}
    </div>
  );
}

function StatCard({ icon, label, value, delay }) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-lg mb-1">{icon}</div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
    </div>
  );
}

function DayCard({ day, activities, onPhotoClick }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200">
          {day}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Day {day}</h3>
          <p className="text-[11px] text-slate-400">{activities?.length || 0} activities</p>
        </div>
      </div>
      <div className="p-5">
        {activities?.map((act, i) => (
          <ActivityItem key={i} activity={act} index={i} onPhotoClick={onPhotoClick} />
        ))}
      </div>
    </div>
  );
}

const CATEGORY_STYLES = {
  Food:      { badge: 'bg-orange-50 text-orange-600', icon: '🍜' },
  History:   { badge: 'bg-amber-50 text-amber-600', icon: '🏛️' },
  Adventure: { badge: 'bg-emerald-50 text-emerald-600', icon: '🧗' },
  Culture:   { badge: 'bg-purple-50 text-purple-600', icon: '🎭' },
  Nature:    { badge: 'bg-green-50 text-green-600', icon: '🌿' },
  Shopping:  { badge: 'bg-pink-50 text-pink-600', icon: '🛍️' },
  Nightlife: { badge: 'bg-indigo-50 text-indigo-600', icon: '🌃' },
  Default:   { badge: 'bg-slate-50 text-slate-600', icon: '📍' },
};

function ActivityItem({ activity, index, onPhotoClick }) {
  const s = CATEGORY_STYLES[activity.category] || CATEGORY_STYLES.Default;

  return (
    <div className={`relative flex gap-3 pb-5 last:pb-0 group animate-fade-in`} style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-xs shadow-sm">
          {s.icon}
        </div>
        {index < (activity._count || 0) - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1.5" />}
      </div>
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-50 p-3.5 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{activity.time}</span>
            <button
              onClick={() => onPhotoClick?.(activity.title)}
              className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition cursor-pointer text-left"
            >
              {activity.title}
            </button>
          </div>
          <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${s.badge}`}>
            {activity.category}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{activity.description}</p>
        <div className="flex flex-wrap gap-2.5 text-[11px] text-slate-400">
          {activity.duration && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {activity.duration}
            </span>
          )}
          {activity.estimated_cost && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              {activity.estimated_cost}
            </span>
          )}
        </div>
        {activity.tips && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5">
            <span className="text-xs">💡</span>
            <span>{activity.tips}</span>
          </div>
        )}
      </div>
    </div>
  );
}
