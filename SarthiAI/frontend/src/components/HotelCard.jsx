const TYPE_STYLES = {
  budget: { badge: 'bg-emerald-50 text-emerald-600', label: 'Budget' },
  'mid-range': { badge: 'bg-indigo-50 text-indigo-600', label: 'Mid-Range' },
  luxury: { badge: 'bg-amber-50 text-amber-600', label: 'Luxury' },
};

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`w-3 h-3 ${i < full ? 'text-amber-400' : i === full && hasHalf ? 'text-amber-300' : 'text-slate-200'}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function HotelCard({ hotels, currency }) {
  if (!hotels?.length) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-xs">🏨</div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Hotel Recommendations</h3>
          <p className="text-[11px] text-slate-400">Agent: Hotel Advisor</p>
        </div>
      </div>

      <div className="grid gap-4">
        {hotels.map((hotel, idx) => {
          const style = TYPE_STYLES[hotel.type] || TYPE_STYLES['mid-range'];
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{hotel.name}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>{style.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <StarRating rating={hotel.rating} />
                    <span>{hotel.rating}</span>
                    <span>·</span>
                    <span>{hotel.location}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-800">{currency}{hotel.price_per_night}</p>
                  <p className="text-[10px] text-slate-400">/ night</p>
                  {hotel.total_cost && <p className="text-[10px] font-medium text-indigo-600">{currency}{hotel.total_cost} total</p>}
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2">{hotel.description}</p>
              {hotel.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {hotel.amenities.map((a, i) => (
                    <span key={i} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">{a}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                {hotel.proximity && <span>📍 {hotel.proximity}</span>}
                {hotel.booking_tip && (
                  <span className="text-emerald-600 font-medium">💡 {hotel.booking_tip}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
