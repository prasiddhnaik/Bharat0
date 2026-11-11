import { fetchOgdSnapshot } from '../src/lib/ingestion/ogd-catalogs.js';

// Fixed official parliamentary index groups. No caller-supplied URLs or database access.
export async function GET(request: Request) {
	if (new URL(request.url).search) return Response.json({ error: 'Query parameters are not supported.' }, { status: 400 });
	try {
		return Response.json(await fetchOgdSnapshot(), { headers: { 'cache-control': 'public, s-maxage=600' } });
	} catch (error) {
		console.error('Official OGD catalog fetch failed:', error instanceof Error ? error.message : 'Unknown source error');
		return Response.json({ error: 'Official OGD metadata is unavailable; retain the last successful catalog data.' }, { status: 502, headers: { 'cache-control': 'no-store' } });
	}
}
