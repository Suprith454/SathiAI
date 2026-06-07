import { useState, useCallback } from 'react';

export default function useItinerary() {
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [weather, setWeather] = useState(null);
  const [heroPhotos, setHeroPhotos] = useState([]);
  const [destination, setDestination] = useState('');
  const [error, setError] = useState(null);

  const fetchMedia = useCallback(async (dest, days) => {
    const [photosRes, weatherRes] = await Promise.allSettled([
      fetch(`/api/photos?q=${encodeURIComponent(dest)}&per_page=10`),
      fetch(`/api/weather?dest=${encodeURIComponent(dest)}&days=${days || 3}`),
    ]);
    if (photosRes.status === 'fulfilled' && photosRes.value.ok) {
      const data = await photosRes.value.json();
      setHeroPhotos(data.photos || []);
    }
    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      setWeather(await weatherRes.value.json());
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
          budget: params.budget || 'medium',
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Server error (${res.status})`); }
      const data = await res.json();
      setItinerary(data);
      fetchMedia(params.destination, params.duration);
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
