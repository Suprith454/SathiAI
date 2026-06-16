import { useState, useCallback } from 'react';

export default function useItinerary() {
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [weather, setWeather] = useState(null);
  const [heroPhotos, setHeroPhotos] = useState([]);
  const [destination, setDestination] = useState('');
  const [error, setError] = useState(null);

  const fetchMedia = useCallback(async (dest, days, embeddedWeather) => {
    if (embeddedWeather) {
      setWeather(embeddedWeather);
    }
    const promises = [fetch(`/api/photos?q=${encodeURIComponent(dest)}&per_page=10`)];
    if (!embeddedWeather) {
      promises.push(fetch(`/api/weather?dest=${encodeURIComponent(dest)}&days=${days || 3}`));
    }
    const results = await Promise.allSettled(promises);
    if (results[0].status === 'fulfilled' && results[0].value.ok) {
      const d = await results[0].value.json();
      setHeroPhotos(d.photos || []);
    }
    if (!embeddedWeather && results.length > 1 && results[1].status === 'fulfilled' && results[1].value.ok) {
      setWeather(await results[1].value.json());
    }
  }, []);

  const generate = useCallback(async (params) => {
    if (!params?.destination) return;
    setLoading(true);
    setError(null);
    setDestination(params.destination);

    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: params.destination,
          duration: params.duration || 3,
          interests: params.interests || ['Food'],
          budget: params.budget ?? 500,
          currency: params.currency || '$',
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Server error (${res.status})`); }
      const data = await res.json();
      if (typeof params.budget === 'number') data.budget = params.budget;
      if (params.currency) data.currency = params.currency;
      setItinerary(data);
      fetchMedia(params.destination, params.duration, data.weather);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMedia]);

  const showFromChat = useCallback(async (itineraryData, params) => {
    setLoading(true);
    setItinerary(itineraryData);
    const dest = params?.destination || itineraryData.destination || '';
    setDestination(dest);
    await fetchMedia(dest, params?.duration || 3);
    setLoading(false);
  }, [fetchMedia]);

  const reset = useCallback(() => {
    setItinerary(null);
    setWeather(null);
    setHeroPhotos([]);
    setDestination('');
    setError(null);
  }, []);

  return { generate, showFromChat, loading, itinerary, weather, heroPhotos, destination, error, reset };
}
