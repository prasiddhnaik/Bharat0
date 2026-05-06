import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INDIA_STATE_MAP_FEATURES, INDIA_STATE_MAP_SOURCE, INDIA_STATE_MAP_VIEWBOX } from '$lib/assets/india-state-boundaries';
import { formatDate } from '$lib/domain/bill-stage-machine';
import {
	EXPECTED_STATE_GOVERNANCE_FIELD_ORDER,
	STATE_GOVERNANCE_DATA_AS_OF,
	STATE_GOVERNANCE_NEXT_REVIEW,
	STATE_GOVERNANCE_RECORDS,
	STATE_GOVERNANCE_STATUS_VISUALS,
	STATE_GOVERNANCE_VISUAL_PALETTE,
	getStateGovernanceRows,
	getStateGovernanceVisual,
	governanceAllianceLabels,
	governanceStatusLabels,
	stateGovernanceById,
	summarizeStateGovernance,
	type StateGovernanceRecord
} from '$lib/domain/state-governance';
import type { Language } from '$lib/domain/localization';

type StatesSectionProps = {
	language: Language;
	onNavigate: (href: string) => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

function getGovernanceSwatchStyle(record: StateGovernanceRecord): CSSProperties {
	const visual = getStateGovernanceVisual(record);
	const style: CSSProperties = {
		background: visual.fill,
		borderColor: visual.stroke
	};
	if (visual.pattern === 'coalition-stripe') {
		style.background = `repeating-linear-gradient(45deg, ${visual.fill} 0 6px, var(--bz-surface) 6px 9px)`;
	}
	if (visual.pattern === 'presidents-rule-hatch') {
		style.background = `repeating-linear-gradient(45deg, ${visual.fill} 0 4px, var(--bz-surface) 4px 7px)`;
	}
	if (visual.pattern === 'caretaker-dash') {
		style.borderStyle = 'dashed';
		style.background = `linear-gradient(135deg, ${visual.fill}, ${visual.softFill})`;
	}
	if (visual.pattern === 'muted-solid') {
		style.opacity = 0.78;
	}
	return style;
}

function GovernanceSwatch({ record, className }: { record: StateGovernanceRecord; className?: string }) {
	return <span aria-hidden="true" className={cx('shrink-0 border', className)} style={getGovernanceSwatchStyle(record)} />;
}

function internalLinkHandler(href: string, onNavigate: (href: string) => void) {
	return (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		onNavigate(href);
	};
}

export function StatesSection({ language, onNavigate }: StatesSectionProps) {
	const [selectedId, setSelectedId] = useState('IN-MH');
	const [pulseId, setPulseId] = useState<string | null>(null);
	const rowRefs = useRef<Record<string, HTMLElement | null>>({});
	const pulseTimer = useRef<number | null>(null);
	const selectedRecord = stateGovernanceById.get(selectedId) ?? STATE_GOVERNANCE_RECORDS[0];
	const allianceCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const record of STATE_GOVERNANCE_RECORDS) {
			counts.set(record.alliance, (counts.get(record.alliance) ?? 0) + 1);
		}
		return counts;
	}, []);
	const statusCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const record of STATE_GOVERNANCE_RECORDS) {
			counts.set(record.status, (counts.get(record.status) ?? 0) + 1);
		}
		return counts;
	}, []);

	const selectState = useCallback((id: string, options: { scroll?: boolean } = {}) => {
		setSelectedId(id);
		setPulseId(id);
		if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
		pulseTimer.current = window.setTimeout(() => setPulseId(null), 850);
		if (options.scroll) {
			window.setTimeout(() => {
				rowRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 20);
		}
	}, []);

	useEffect(() => {
		return () => {
			if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
		};
	}, []);

	return (
		<section className="grid gap-3">
			<StateGovernanceBanner language={language} onNavigate={onNavigate} />

			<div className="order-2 grid gap-3 lg:order-1 xl:grid-cols-[minmax(0,1fr)_21rem]">
				<article className="bz-panel overflow-hidden rounded-lg">
					<div className="border-b border-[var(--bz-border)] p-4 sm:p-5">
						<div className="min-w-0">
							<p className="bz-eyebrow text-[var(--bz-accent)]">State governance map</p>
							<h1 className="mt-1 max-w-3xl text-xl font-semibold tracking-tight text-[var(--bz-text-1)] sm:text-2xl">
								India by governing alliance and status
							</h1>
							<p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--bz-text-2)]">
								Map coloring follows the current ministry or administration status. Tap a region to lock the detail panel and jump to its row.
							</p>
						</div>
						<StateGovernanceSnapshot allianceCounts={allianceCounts} statusCounts={statusCounts} />
					</div>
					<div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
						<IndiaGovernanceMap
							selectedRecord={selectedRecord}
							selectedId={selectedId}
							pulseId={pulseId}
							onPreview={(id) => selectState(id)}
							onSelect={(id) => selectState(id, { scroll: true })}
						/>
						<StateGovernanceLegend allianceCounts={allianceCounts} statusCounts={statusCounts} />
					</div>
				</article>

				<StateGovernanceDetail record={selectedRecord} />
			</div>

			<StateGovernanceList selectedId={selectedId} rowRefs={rowRefs} onSelect={(id) => selectState(id)} />
		</section>
	);
}

function StateGovernanceBanner({ language, onNavigate }: { language: Language; onNavigate: (href: string) => void }) {
	const stateCount = STATE_GOVERNANCE_RECORDS.filter((record) => record.type === 'state').length;
	const utCount = STATE_GOVERNANCE_RECORDS.length - stateCount;
	return (
		<div className="order-1 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3 text-xs leading-5 text-[var(--bz-text-2)] shadow-sm lg:order-none">
			<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
				<div className="grid gap-2 sm:grid-cols-3">
					<div className="min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2">
						<p className="bz-eyebrow text-[9.5px]">Data as of</p>
						<p className="mt-1 font-semibold text-[var(--bz-text-1)]">{formatDate(STATE_GOVERNANCE_DATA_AS_OF)}</p>
					</div>
					<div className="min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2">
						<p className="bz-eyebrow text-[9.5px]">Coverage</p>
						<p className="mt-1 font-semibold text-[var(--bz-text-1)]">{stateCount} states · {utCount} UTs</p>
					</div>
					<div className="min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2">
						<p className="bz-eyebrow text-[9.5px]">Review rule</p>
						<p className="mt-1 truncate font-semibold text-[var(--bz-text-1)]" title={STATE_GOVERNANCE_NEXT_REVIEW}>
							After official transition notices
						</p>
					</div>
				</div>
				<a
					className="inline-flex justify-center rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2.5 py-1.5 text-center text-[10.5px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus"
					href={`/methodology?lang=${language}`}
					onClick={internalLinkHandler(`/methodology?lang=${language}`, onNavigate)}
				>
					How this is classified
				</a>
			</div>
		</div>
	);
}

function StateGovernanceSnapshot({ allianceCounts, statusCounts }: { allianceCounts: Map<string, number>; statusCounts: Map<string, number> }) {
	const snapshotItems = [
		{ label: 'NDA-led', value: allianceCounts.get('NDA') ?? 0, record: STATE_GOVERNANCE_RECORDS.find((record) => record.alliance === 'NDA') },
		{ label: 'INDIA-led', value: allianceCounts.get('INDIA') ?? 0, record: STATE_GOVERNANCE_RECORDS.find((record) => record.alliance === 'INDIA') },
		{ label: 'Regional', value: allianceCounts.get('regional') ?? 0, record: STATE_GOVERNANCE_RECORDS.find((record) => record.alliance === 'regional') },
		{ label: 'Coalitions', value: statusCounts.get('active_coalition') ?? 0, record: STATE_GOVERNANCE_RECORDS.find((record) => record.status === 'active_coalition') },
		{ label: 'No ministry', value: STATE_GOVERNANCE_RECORDS.filter((record) => record.alliance === 'none' || record.status === 'presidents_rule').length, record: STATE_GOVERNANCE_RECORDS.find((record) => record.alliance === 'none') }
	];

	return (
		<div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
			{snapshotItems.map((item) => (
				<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2" key={item.label}>
					<div className="flex items-center justify-between gap-2">
						<span className="flex min-w-0 items-center gap-2">
							{item.record && <GovernanceSwatch record={item.record} className="h-3 w-3 rounded-sm" />}
							<span className="truncate text-[11px] font-semibold text-[var(--bz-text-2)]">{item.label}</span>
						</span>
						<span className="bz-mono text-base font-bold text-[var(--bz-text-1)]">{item.value}</span>
					</div>
				</div>
			))}
		</div>
	);
}

function IndiaGovernanceMap({
	selectedRecord,
	selectedId,
	pulseId,
	onPreview,
	onSelect
}: {
	selectedRecord: StateGovernanceRecord;
	selectedId: string;
	pulseId: string | null;
	onPreview: (id: string) => void;
	onSelect: (id: string) => void;
}) {
	const selectedVisual = getStateGovernanceVisual(selectedRecord);
	return (
		<div className="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2.5">
			<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-2 shadow-sm">
				<svg className="block h-auto max-h-[70vh] min-h-[23rem] w-full" viewBox={INDIA_STATE_MAP_VIEWBOX} role="img" aria-label="India state and Union territory governance map">
				<defs>
					<pattern id="state-coalition-stripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
						<path d="M0 0 L0 10" stroke="var(--bz-surface)" strokeWidth="3" opacity="0.46" />
					</pattern>
					<pattern id="state-presidents-rule-hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
						<path d="M0 0 L0 7" stroke="var(--bz-text-2)" strokeWidth="2" opacity="0.58" />
					</pattern>
					<pattern id="state-caretaker-dash" patternUnits="userSpaceOnUse" width="9" height="9">
						<path d="M0 4.5 H5" stroke="var(--bz-surface)" strokeWidth="2" opacity="0.55" />
					</pattern>
				</defs>
				<rect x="0" y="0" width="760" height="820" rx="18" fill="var(--bz-surface)" opacity="0.65" />
				<path d="M86 632 C190 588 304 606 401 574 C520 535 575 430 690 402" fill="none" stroke="var(--bz-border)" strokeDasharray="8 10" strokeWidth="1.4" opacity="0.42" />
				<path d="M104 232 C214 197 332 214 444 184 C530 161 612 108 681 71" fill="none" stroke="var(--bz-border)" strokeDasharray="8 10" strokeWidth="1.4" opacity="0.35" />
				{INDIA_STATE_MAP_FEATURES.map((feature) => {
					const record = stateGovernanceById.get(feature.id);
					if (!record) return null;
					const visual = getStateGovernanceVisual(record);
					const patternId =
						visual.pattern === 'coalition-stripe'
							? 'state-coalition-stripe'
							: visual.pattern === 'presidents-rule-hatch'
								? 'state-presidents-rule-hatch'
								: visual.pattern === 'caretaker-dash'
									? 'state-caretaker-dash'
									: null;
					const selected = feature.id === selectedId;
					const pulse = feature.id === pulseId;
					return (
						<g key={feature.id}>
							<path
								aria-label={`${record.name_en}: ${governanceStatusLabels[record.status]}, ${governanceAllianceLabels[record.alliance]}`}
								className={cx(
									'cursor-pointer outline-none transition duration-150 bz-focus',
									selected ? 'drop-shadow-sm' : 'hover:brightness-105',
									pulse && 'bz-state-pulse'
								)}
								d={feature.d}
								fill={visual.fill}
								fillRule="evenodd"
								onClick={() => onSelect(feature.id)}
								onFocus={() => onPreview(feature.id)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										onSelect(feature.id);
									}
								}}
								role="button"
								stroke={selected ? 'var(--bz-text-1)' : visual.stroke}
								strokeDasharray={visual.strokeStyle === 'dashed' ? '9 6' : undefined}
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={selected ? 2.5 : 1}
								tabIndex={0}
							>
								<title>{`${record.name_en} · ${governanceStatusLabels[record.status]} · ${record.lead_party ?? 'No elected ministry'}`}</title>
							</path>
							{patternId && <path d={feature.d} fill={`url(#${patternId})`} fillRule="evenodd" pointerEvents="none" />}
						</g>
					);
				})}
				</svg>
			</div>
			<div className="mt-3 grid gap-2 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
				<div className="flex min-w-0 items-start gap-3">
					<GovernanceSwatch record={selectedRecord} className="mt-1 h-5 w-5 rounded-md" />
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-[var(--bz-text-1)]">{selectedRecord.name_en}</p>
						<p className="mt-1 text-xs leading-5 text-[var(--bz-text-2)]">
							{governanceStatusLabels[selectedRecord.status]} · {governanceAllianceLabels[selectedRecord.alliance]}
						</p>
					</div>
				</div>
				<span className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: selectedVisual.softFill, color: selectedVisual.stroke }}>
					{selectedVisual.statusCue}
				</span>
			</div>
			<div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-[var(--bz-text-3)]">
				<span>{INDIA_STATE_MAP_SOURCE.org}</span>
				<span>{INDIA_STATE_MAP_SOURCE.note}</span>
			</div>
		</div>
	);
}

function StateGovernanceLegend({ allianceCounts, statusCounts }: { allianceCounts: Map<string, number>; statusCounts: Map<string, number> }) {
	const legendKeys = ['NDA', 'INDIA', 'regional', 'left', 'centrally_administered'] as const;
	const treatmentRows = [
		{ label: 'Coalition', cue: 'diagonal stripe', count: statusCounts.get('active_coalition') ?? 0, record: STATE_GOVERNANCE_RECORDS.find((record) => record.status === 'active_coalition') },
		{ label: "President's rule", cue: 'dense hatch', count: statusCounts.get('presidents_rule') ?? 0, record: STATE_GOVERNANCE_RECORDS.find((record) => record.status === 'presidents_rule') },
		{ label: 'Caretaker', cue: 'dashed border', count: statusCounts.get('caretaker') ?? 0, record: STATE_GOVERNANCE_RECORDS.find((record) => record.status === 'caretaker') }
	];
	return (
		<aside className="grid content-start gap-2" aria-label="Governance map legend">
			<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3">
				<p className="bz-eyebrow text-[9.5px]">Map key</p>
				<p className="mt-1 text-xs leading-5 text-[var(--bz-text-2)]">Alliance color comes first; status adds the secondary cue.</p>
			</div>
			{legendKeys.map((key) => {
				const item = STATE_GOVERNANCE_VISUAL_PALETTE[key];
				const count = key === 'centrally_administered' ? STATE_GOVERNANCE_RECORDS.filter((record) => record.status === 'centrally_administered').length : allianceCounts.get(key) ?? 0;
				return (
					<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-2" key={key}>
						<div className="flex items-center justify-between gap-2">
							<span className="flex min-w-0 items-center gap-2">
								<span className="h-3 w-3 shrink-0 rounded-sm border border-[var(--bz-border)]" style={{ background: item.fill, borderColor: item.stroke }} />
								<span className="truncate text-xs font-semibold text-[var(--bz-text-1)]">{item.label}</span>
							</span>
							<span className="bz-mono text-xs font-semibold text-[var(--bz-text-2)]">{count}</span>
						</div>
					</div>
				);
			})}
			<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-2">
				<div className="grid gap-2">
					{treatmentRows.map((row) => (
						<div className="flex items-center justify-between gap-2 text-[11px] text-[var(--bz-text-2)]" key={row.label}>
							<span className="flex min-w-0 items-center gap-2">
								{row.record ? <GovernanceSwatch record={row.record} className="h-3.5 w-3.5 rounded-sm" /> : <span className="h-3.5 w-3.5 rounded-sm border border-dashed border-[var(--bz-border)]" />}
								<span className="truncate"><span className="font-semibold text-[var(--bz-text-1)]">{row.label}</span> · {row.cue}</span>
							</span>
							<span className="bz-mono text-[10px] font-semibold text-[var(--bz-text-3)]">{row.count}</span>
						</div>
					))}
				</div>
			</div>
		</aside>
	);
}

function StateGovernanceDetail({ record }: { record: StateGovernanceRecord }) {
	const visual = getStateGovernanceVisual(record);
	return (
		<article className="bz-panel overflow-hidden rounded-lg" aria-live="polite">
			<div className="h-1.5" style={{ background: visual.fill }} />
			<div className="p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="bz-eyebrow">Selected state</p>
						<h2 className="mt-1 text-xl font-semibold leading-tight text-[var(--bz-text-1)]">{record.name_en}</h2>
						<p className="mt-1 text-sm text-[var(--bz-text-2)]">{record.name_local}</p>
					</div>
					<GovernanceSwatch record={record} className="h-8 w-8 rounded-md" />
				</div>
				<div className="mt-4 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
					<span className="inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: visual.softFill, color: visual.stroke }}>
						{governanceStatusLabels[record.status]}
					</span>
					<p className="mt-3 text-sm leading-6 text-[var(--bz-text-2)]">{summarizeStateGovernance(record)}</p>
					<div className="mt-3 grid gap-2">
						<div className="rounded-md bg-[var(--bz-surface)] px-3 py-2">
							<p className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-3)]">Lead party</p>
							<p className="mt-1 text-sm font-semibold text-[var(--bz-text-1)]">{record.lead_party ?? 'No elected ministry'}</p>
						</div>
						<div className="rounded-md bg-[var(--bz-surface)] px-3 py-2">
							<p className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-3)]">Chief Minister</p>
							<p className="mt-1 text-sm font-semibold text-[var(--bz-text-1)]">{record.chief_minister ?? 'No Chief Minister'}</p>
						</div>
					</div>
				</div>
				<GovernanceFields record={record} compact />
				<a className="mt-4 inline-flex w-full justify-center rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus" href={record.source_url} target="_blank" rel="noreferrer">
					Open source
				</a>
			</div>
		</article>
	);
}

function StateGovernanceList({
	selectedId,
	rowRefs,
	onSelect
}: {
	selectedId: string;
	rowRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
	onSelect: (id: string) => void;
}) {
	return (
		<section className="order-1 grid gap-2 lg:order-2" aria-label="State governance list">
			<div className="flex flex-wrap items-end justify-between gap-3 px-1">
				<div className="min-w-0">
					<p className="bz-eyebrow">All states and Union territories</p>
					<h2 className="mt-1 text-base font-semibold text-[var(--bz-text-1)]">Governance records</h2>
				</div>
				<p className="w-full max-w-full text-xs text-[var(--bz-text-3)] sm:w-auto">{STATE_GOVERNANCE_RECORDS.length} records · ISO 3166-2:IN ids</p>
			</div>
			<div className="overflow-hidden rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] shadow-sm">
				{STATE_GOVERNANCE_RECORDS.map((record) => (
					<StateGovernanceRow
						key={record.id}
						record={record}
						selected={record.id === selectedId}
						setRef={(node) => {
							rowRefs.current[record.id] = node;
						}}
						onSelect={() => onSelect(record.id)}
					/>
				))}
			</div>
		</section>
	);
}

function StateGovernanceRow({
	record,
	selected,
	setRef,
	onSelect
}: {
	record: StateGovernanceRecord;
	selected: boolean;
	setRef: (node: HTMLElement | null) => void;
	onSelect: () => void;
}) {
	const visual = getStateGovernanceVisual(record);
	return (
		<article
			className={cx(
				'border-b border-[var(--bz-border)] transition last:border-b-0',
				selected ? 'bg-[var(--bz-accent-3)] shadow-[inset_4px_0_0_var(--bz-accent)]' : 'bg-[var(--bz-surface)] hover:bg-[var(--bz-surface-2)]'
			)}
			ref={setRef}
		>
			<button className="grid w-full gap-3 px-3 py-3 text-left bz-focus md:grid-cols-[minmax(13rem,18rem)_minmax(0,1fr)] lg:px-4" type="button" onClick={onSelect}>
				<span className="flex min-w-0 items-start gap-3">
					<GovernanceSwatch record={record} className="mt-1 h-4 w-4 rounded-sm" />
					<span className="min-w-0">
						<span className="flex flex-wrap items-center gap-2">
							<span className="block text-sm font-semibold leading-tight text-[var(--bz-text-1)]">{record.name_en}</span>
							<span className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]" style={{ background: visual.softFill, color: visual.stroke }}>
								{governanceAllianceLabels[record.alliance]}
							</span>
						</span>
						<span className="mt-1 block text-xs text-[var(--bz-text-2)]">{record.name_local}</span>
						<span className="bz-mono mt-1 block text-[10px] text-[var(--bz-text-3)]">{record.id} · {governanceStatusLabels[record.status]}</span>
					</span>
				</span>
				<GovernanceFields record={record} variant="plain" />
			</button>
		</article>
	);
}

function GovernanceFields({ record, compact = false, variant = 'tiles' }: { record: StateGovernanceRecord; compact?: boolean; variant?: 'tiles' | 'plain' }) {
	const rows = getStateGovernanceRows(record);
	return (
		<dl className={cx('grid gap-2', compact ? 'mt-4 grid-cols-1' : variant === 'plain' ? 'grid-cols-2 xl:grid-cols-5' : 'sm:grid-cols-2 xl:grid-cols-4')}>
			{rows.map((row) => {
				const displayValue = row.field === 'event_date' || row.field === 'last_verified' ? formatDate(row.value) : row.value;
				return (
					<div className={cx('min-w-0', variant === 'tiles' ? 'rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1.5' : 'py-0.5')} key={row.field}>
						<dt className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-3)]">{row.label}</dt>
						<dd className="mt-0.5 truncate text-[11px] font-semibold text-[var(--bz-text-1)]" title={displayValue}>
							{displayValue}
						</dd>
					</div>
				);
			})}
			<span className="sr-only">{EXPECTED_STATE_GOVERNANCE_FIELD_ORDER.join(', ')}</span>
		</dl>
	);
}

export function StateGovernanceMethodology({ language, onNavigate }: StatesSectionProps) {
	const statusRows = Object.entries(STATE_GOVERNANCE_STATUS_VISUALS);
	return (
		<section className="space-y-3">
			<article className="bz-panel rounded-lg p-5">
				<a
					className="inline-flex rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus"
					href={`/?section=states&lang=${language}`}
					onClick={internalLinkHandler(`/?section=states&lang=${language}`, onNavigate)}
				>
					Back to States
				</a>
				<p className="bz-eyebrow mt-5 text-[var(--bz-accent)]">Methodology</p>
				<h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--bz-text-1)]">How BharatZero classifies state governance</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--bz-text-2)]">
					The States tab describes the current governing arrangement. It does not measure vote share or ideological support. Each record is a source-backed snapshot of who currently runs the ministry, or whether the territory is administered without an elected state ministry.
				</p>
			</article>
			<div className="grid gap-3 lg:grid-cols-2">
				<MethodologyPanel
					title="Lead party rule"
					body="In coalitions, lead_party means the Chief Minister’s party. This is more observable than seat-leading party because it changes only when a new government is sworn in."
				/>
				<MethodologyPanel
					title="Coalitions"
					body="Active coalition records list the Chief Minister’s party first, followed by formal governing allies. The map uses alliance color plus diagonal striping."
				/>
				<MethodologyPanel
					title="Transition states"
					body="President’s rule means Centre-led administration. Caretaker means an outgoing ministry remains in office until the next government is sworn in."
				/>
				<MethodologyPanel
					title="Update triggers"
					body="A record is reviewed after an ECI-certified result, Chief Minister swearing-in or resignation, Governor or President notification, or a formal coalition change."
				/>
			</div>
			<section className="bz-panel rounded-lg p-5">
				<p className="bz-eyebrow">Status visuals</p>
				<div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
					{statusRows.map(([status, visual]) => (
						<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3" key={status}>
							<p className="text-xs font-semibold text-[var(--bz-text-1)]">{governanceStatusLabels[status as keyof typeof governanceStatusLabels]}</p>
							<p className="mt-1 text-[11px] leading-5 text-[var(--bz-text-2)]">{visual.statusCue}</p>
							<p className="bz-mono mt-2 text-[10px] text-[var(--bz-text-3)]">{visual.pattern} · {visual.strokeStyle}</p>
						</div>
					))}
				</div>
			</section>
			<section className="bz-panel rounded-lg p-5">
				<p className="bz-eyebrow">Source policy</p>
				<h2 className="mt-2 text-lg font-semibold text-[var(--bz-text-1)]">Boundary and governance provenance</h2>
				<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">
					Map boundaries are self-hosted from {INDIA_STATE_MAP_SOURCE.org}. Governance rows use the visible source link on each record and are checked by the state-governance verifier.
				</p>
				<a className="mt-4 inline-flex rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus" href={INDIA_STATE_MAP_SOURCE.url} target="_blank" rel="noreferrer">
					Open boundary source
				</a>
			</section>
		</section>
	);
}

function MethodologyPanel({ title, body }: { title: string; body: string }) {
	return (
		<article className="bz-panel rounded-lg p-4">
			<h2 className="text-base font-semibold text-[var(--bz-text-1)]">{title}</h2>
			<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">{body}</p>
		</article>
	);
}
