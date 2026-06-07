import { useState, useEffect } from 'react';

export default function PhotoModal({ query, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`/api/photos?q=${encodeURIComponent(query)}&per_page=12`)
      .then((r) => r.json())
      .then((data) => setPhotos(data.photos || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && selected > 0) setSelected(selected - 1);
      if (e.key === 'ArrowRight' && selected < photos.length - 1) setSelected(selected + 1);
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [photos, selected, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-sm font-medium truncate mr-4">{query}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white/10 rounded-2xl p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-white/30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-white/50 text-sm">No photos found for "{query}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto max-h-[75vh] pr-1">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5 cursor-pointer group relative"
                onClick={() => setSelected(i)}
              >
                <img
                  src={photo.thumb}
                  alt={photo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <a
                  href={photo.credit.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-1.5 right-2 text-[10px] text-white/0 group-hover:text-white/60 hover:text-white/90 transition truncate max-w-[90%]"
                >
                  {photo.credit.name}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Full-size preview */}
        {selected !== null && photos[selected] && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setSelected(null)}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer z-10">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {selected > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setSelected(selected - 1); }} className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            <img src={photos[selected].url} alt={photos[selected].alt} className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
            {selected < photos.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setSelected(selected + 1); }} className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
            <a href={photos[selected].credit.link} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 text-xs text-white/40 hover:text-white/70 transition">
              Photo by {photos[selected].credit.name}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
