import { useEffect, useState } from 'react';
import type { SourceRefreshStatus } from '../domain/ingestion-status';

export function DataRefreshStatus({ refreshes }: { refreshes?: SourceRefreshStatus[] }) {
	const [loaded, setLoaded] = useState<SourceRefreshStatus[] | null>(null);
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		if (refreshes) return;
		const controller = new AbortController();
		void fetch('/api/sources/status', { signal: controller.signal }).then(async (response) => {
			if (!response.ok) throw new Error('Status unavailable');
			const body = await response.json() as { sources: SourceRefreshStatus[] };
			if (!controller.signal.aborted) setLoaded(body.sources);
		}).catch(() => { if (!controller.signal.aborted) setFailed(true); });
		return () => controller.abort();
	}, [refreshes]);
	const rows = refreshes ?? loaded;
	const date = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value));
	return <section className="bz-panel rounded-lg p-4" aria-label="Data refresh status">
		<h2 className="text-base font-semibold">Data refresh status</h2>
		<p className="mt-1 text-xs text-[var(--bz-text-2)]">Weekly schedule: Monday, 9:00 AM IST. A failed source keeps its last successful data.</p>
		{!rows && <p className="mt-3 text-xs" role="status">{failed ? 'Refresh status is unavailable. Source freshness could not be checked.' : 'Loading source status…'}</p>}
		<div className="mt-3 grid gap-3 sm:grid-cols-2">
			{rows?.map((refresh) => <article className="rounded-md border border-[var(--bz-border)] p-3 text-xs leading-5" key={refresh.source}>
				<h3 className="font-semibold">{refresh.label}</h3>
				<p>Latest attempt: {refresh.status === 'never' ? 'Not run yet' : refresh.status}{refresh.attemptedAt ? ` · ${date(refresh.attemptedAt)}` : ''}</p>
				<p>Last successful import: {refresh.succeededAt ? date(refresh.succeededAt) : 'Not recorded'}</p>
				{refresh.coverage && <p className="mt-1 text-[var(--bz-text-2)]">{refresh.coverage}</p>}
				{refresh.sourceRows !== null && <p>{refresh.sourceRows.toLocaleString('en-IN')} source records · {refresh.inserted} added · {refresh.updated} updated</p>}
				{refresh.latestRecordDate && <p>Latest source record date: {date(refresh.latestRecordDate)}</p>}
			</article>)}
		</div>
	</section>;
}
