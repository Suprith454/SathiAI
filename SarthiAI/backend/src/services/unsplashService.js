import { config } from '../config/env.js';

export async function getCityImage(city) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', `${city} city skyline`);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'landscape');

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${config.unsplash.accessKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Unsplash API error: ${res.status}`);
  }

  const data = await res.json();
  const photo = data.results?.[0];

  if (!photo) {
    return { image: null, credit: null };
  }

  return {
    image: photo.urls.regular,
    credit: {
      name: photo.user.name,
      link: photo.links.html,
    },
  };
}
