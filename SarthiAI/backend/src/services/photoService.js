import { config } from '../config/env.js';

export async function searchPhotos(query, perPage = 8) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('orientation', 'landscape');

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${config.unsplash.accessKey}`,
    },
  });

  if (!res.ok) {
    if (res.status === 403) return [];
    throw new Error(`Unsplash error: ${res.status}`);
  }

  const data = await res.json();
  return (data.results || []).map((photo) => ({
    id: photo.id,
    url: photo.urls.regular,
    thumb: photo.urls.small,
    alt: photo.alt_description || query,
    credit: {
      name: photo.user.name,
      link: photo.links.html,
    },
  }));
}
