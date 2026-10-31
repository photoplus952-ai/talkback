// Where the Cloudflare Worker lives. No secrets here: the Gemini key stays inside the Worker.
// Set at build time with VITE_API_URL, otherwise the default below.
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) || 'https://talkback-api.photoplus952.workers.dev';
