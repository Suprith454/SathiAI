import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import ChatSidebar from './components/ChatSidebar';
import ManualForm from './components/ManualForm';
import DashboardContent from './components/DashboardContent';
import SkeletonLoader from './components/SkeletonLoader';
import PDFExportButton from './components/PDFExportButton';
import useChat from './hooks/useChat';
import useItinerary from './hooks/useItinerary';

const EMPTY_FORM = { destination: '', startDate: '', endDate: '', duration: 1, budget: 'medium', interests: ['Food'] };

export default function App() {
  const chat = useChat();
  const manual = useItinerary();
  const [welcome, setWelcome] = useState(true);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [welcomeBg, setWelcomeBg] = useState('');
  const [bgPhotos, setBgPhotos] = useState([]);
  const [bgIdx, setBgIdx] = useState(0);
  const [suggestionPhotos, setSuggestionPhotos] = useState({});
  const [lastParams, setLastParams] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ duration: 3, interests: ['Food'], budget: 'medium' });

  const SUGGESTIONS = [
    { name: 'Paris', duration: 5, budget: 'medium', interests: ['Food', 'Culture', 'History'], query: 'paris france eiffel tower' },
    { name: 'Tokyo', duration: 7, budget: 'medium', interests: ['Food', 'Culture', 'Shopping'], query: 'tokyo japan shibuya' },
    { name: 'Bali', duration: 6, budget: 'low', interests: ['Nature', 'Adventure', 'Culture'], query: 'bali indonesia beach' },
    { name: 'New York', duration: 4, budget: 'high', interests: ['Culture', 'Shopping', 'Nightlife'], query: 'new york city skyline' },
    { name: 'Dubai', duration: 5, budget: 'high', interests: ['Shopping', 'Adventure', 'Culture'], query: 'dubai uae burj' },
  ];

  useEffect(() => {
    if (chat.itineraryData && !manual.itinerary) {
      const p = chat.itineraryData._params;
      if (p) setLastParams({ destination: p.destination, duration: p.duration || 3, interests: p.interests || ['Food'], budget: p.budget || 'medium' });
      manual.showFromChat(chat.itineraryData, p);
    }
  }, [chat.itineraryData]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiBase}/api/photos?q=travel+destinations+landscape&per_page=1`)
      .then(r => r.json())
      .then(d => { if (d.photos?.length) setWelcomeBg(d.photos[0].url); })
      .catch(() => {});
    fetch(`${apiBase}/api/photos?q=travel+landscapes+world&per_page=8`)
      .then(r => r.json())
      .then(d => { if (d.photos?.length) setBgPhotos(d.photos); })
      .catch(() => {});
    Promise.all(SUGGESTIONS.map(s =>
      fetch(`${apiBase}/api/photos?q=${encodeURIComponent(s.query)}&per_page=1`)
        .then(r => r.json())
        .then(d => ({ name: s.name, photo: d.photos?.[0] || null }))
        .catch(() => ({ name: s.name, photo: null }))
    )).then(results => {
      const map = {};
      results.forEach(r => { map[r.name] = r.photo; });
      setSuggestionPhotos(map);
    });
  }, []);

  useEffect(() => {
    if (bgPhotos.length < 2) return;
    const t = setInterval(() => setBgIdx(i => (i + 1) % bgPhotos.length), 5000);
    return () => clearInterval(t);
  }, [bgPhotos.length]);

  useEffect(() => {
    const t1 = setTimeout(() => setWelcome(false), 4000);
    const t2 = setTimeout(() => setWelcomeDone(true), 4700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const loading = manual.loading || chat.loading;
  const error = manual.error;

  const [form, setForm] = useState(EMPTY_FORM);

  const resetAll = () => {
    chat.clearChat();
    manual.reset();
    setLastParams(null);
    setForm(EMPTY_FORM);
    setEditOpen(false);
  };

  return (
    <DashboardLayout
      sidebar={
        <ChatSidebar
          messages={chat.messages}
          input={chat.input}
          setInput={chat.setInput}
          loading={chat.loading}
          onSend={chat.sendMessage}
          onClear={resetAll}
        />
      }
    >
      {loading ? (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <SkeletonLoader />
        </div>
      ) : manual.itinerary ? (
        <>
          {lastParams && (
            <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 flex items-center gap-2">
              <button onClick={resetAll} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Back
              </button>
              <div className="flex-1 flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{lastParams.duration} days · {lastParams.budget} · {(lastParams.interests || []).join(', ')}</span>
              </div>
              <button
                onClick={() => {
                  setEditForm({ duration: lastParams.duration || 3, interests: lastParams.interests || ['Food'], budget: lastParams.budget || 'medium' });
                  setEditOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>
          )}
          <DashboardContent
            itinerary={manual.itinerary}
            weather={manual.weather}
            destination={manual.destination}
            heroPhotos={manual.heroPhotos}
          />
          <PDFExportButton destination={manual.destination} itinerary={manual.itinerary} />
          <footer className="text-center text-xs text-slate-400 pb-8">Powered by SarthiAI</footer>

          {/* Edit Modal */}
          {editOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 w-full max-w-md mx-4 p-6 md:p-8 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Edit Itinerary</h3>
                  <button onClick={() => setEditOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>

                <label className="text-xs font-semibold text-slate-600 block mb-1.5 uppercase tracking-wider">Duration (Days)</label>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setEditForm(f => ({ ...f, duration: Math.max(1, f.duration - 1) }))} className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 text-lg cursor-pointer transition">−</button>
                  <span className="text-2xl font-bold text-indigo-600 w-12 text-center tabular-nums">{editForm.duration}</span>
                  <button onClick={() => setEditForm(f => ({ ...f, duration: Math.min(30, f.duration + 1) }))} className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 text-lg cursor-pointer transition">+</button>
                </div>

                <label className="text-xs font-semibold text-slate-600 block mb-2 uppercase tracking-wider">Budget</label>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[['low', '💵', 'Budget'], ['medium', '💰', 'Mid'], ['high', '💎', 'Luxury']].map(([val, icon, label]) => (
                    <button key={val} onClick={() => setEditForm(f => ({ ...f, budget: val }))} className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${editForm.budget === val ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <label className="text-xs font-semibold text-slate-600 block mb-2 uppercase tracking-wider">Interests</label>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {['🍜 Food', '🏛️ History', '🧗 Adventure', '🎭 Culture', '🌿 Nature', '🛍️ Shopping', '🌃 Nightlife'].map(item => {
                    const label = item.split(' ').slice(1).join(' ');
                    const active = editForm.interests.includes(label);
                    return (
                      <button key={label} onClick={() => setEditForm(f => ({ ...f, interests: f.interests.includes(label) ? f.interests.filter(i => i !== label) : [...f.interests, label] }))} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${active ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
                        <span>{item.split(' ')[0]}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setEditOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer">Cancel</button>
                  <button onClick={() => { const p = { ...lastParams, duration: editForm.duration, interests: editForm.interests, budget: editForm.budget }; setLastParams(p); setEditOpen(false); manual.generate(p); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/20 transition cursor-pointer">
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="relative min-h-full overflow-hidden">
          {bgPhotos.length > 0 && (
            <>
              {bgPhotos.map((p, i) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === bgIdx ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-indigo-950/50 to-slate-900/70" />
            </>
          )}
          {bgPhotos.length === 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
          )}
          <div className="relative z-10 min-h-full flex flex-col lg:flex-row items-center justify-center gap-6 px-4 md:px-8 py-10">
            <div className="w-full max-w-lg shrink-0">
              {bgPhotos.length > 0 && (
                <div className="mb-6 text-center lg:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Plan Your Next Adventure</h1>
                  <p className="text-indigo-200/80 text-sm mt-1">Where would you like to go?</p>
                </div>
              )}
            <ManualForm
              form={form}
              onChange={setForm}
              onGenerate={(params) => { setLastParams(params); manual.generate(params); }}
              loading={manual.loading}
            />
            </div>

            {/* Suggestions Panel */}
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-white/90 mb-1">Popular Destinations</h3>
                <p className="text-[11px] text-white/50 mb-4">Click to generate an itinerary instantly</p>
                <div className="space-y-3">
                  {SUGGESTIONS.map((s) => {
                    const photo = suggestionPhotos[s.name];
                    return (
                      <button
                        key={s.name}
                        onClick={() => {
                          const p = { destination: s.name, duration: s.duration, budget: s.budget, interests: s.interests };
                          setLastParams(p);
                          manual.generate(p);
                        }}
                        disabled={manual.loading}
                        className="w-full flex items-center gap-3 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer group text-left"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-700">
                          {photo ? (
                            <img src={photo.thumb} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🌍</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{s.name}</p>
                          <p className="text-[10px] text-white/50">{s.duration} days · {s.budget} budget</p>
                        </div>
                        <svg className="w-4 h-4 ml-auto shrink-0 text-white/30 group-hover:text-white/60 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-white/40">Powered by SarthiAI</footer>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 shadow-lg max-w-xs animate-fade-in">
          {error}
        </div>
      )}

      {!welcomeDone && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700" style={{ opacity: welcome ? 1 : 0, backgroundImage: welcomeBg ? `url(${welcomeBg})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {welcomeBg && <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-indigo-950/75 to-slate-900/85" />}
          {!welcomeBg && <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-indigo-500/30 animate-bounce-in mb-6">
              SA
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">SarthiAI</h1>
            <p className="text-lg md:text-xl text-indigo-200/80 mt-4 font-light tracking-wide">Your AI Travel Companion</p>
            <div className="mt-10 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
