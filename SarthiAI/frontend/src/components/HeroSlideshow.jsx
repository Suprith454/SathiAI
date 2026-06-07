import { useState, useEffect, useCallback } from 'react';

export default function HeroSlideshow({ photos, destination, tagline, interval = 4000 }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  const next = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setIdx((prev) => (prev + 1) % photos.length);
      setFade(true);
    }, 300);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [photos.length, interval, next]);

  const current = photos[idx];

  return (
    <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8 shadow-md animate-fade-in">
      {current ? (
        <img
          src={current.url}
          alt={current.alt || destination}
          className={`w-full h-full object-cover transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm text-slate-400">No images available</p>
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Dots indicator */}
      {photos.length > 1 && (
        <div className="absolute top-3 right-4 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setFade(true); }}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                i === idx ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Photo credit */}
      {current?.credit && (
        <a
          href={current.credit.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-4 text-[10px] text-white/40 hover:text-white/70 transition"
        >
          Photo by {current.credit.name}
        </a>
      )}

      {/* Title overlay */}
      <div className="absolute bottom-4 left-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{destination || 'Your Trip'}</h1>
        <p className="text-sm text-white/80 drop-shadow">{tagline || 'Personalized travel plan'}</p>
      </div>
    </div>
  );
}
