export type DebateTranscriptStatus = 'METADATA_ONLY' | 'EXTRACTED' | 'FAILED' | 'STALE';

export type DebateTranscriptMetadata = {
	source_url: string;
	resolved_url: string | null;
	content_type: string | null;
	byte_length: number | null;
};

export type ExistingDebateTranscript = {
	status: DebateTranscriptStatus;
	extracted_from_url: string | null;
	text?: string;
	text_hash?: string | null;
	char_count?: number;
	error?: string | null;
	extracted_at?: Date | string;
};

export type DebateTranscriptMetadataUpdate = DebateTranscriptMetadata & {
	status?: 'STALE';
};

export function getEffectiveTranscriptUrl(metadata: Pick<DebateTranscriptMetadata, 'source_url' | 'resolved_url'>) {
	return metadata.resolved_url?.trim() || metadata.source_url;
}

export function shouldMarkTranscriptStale(existing: ExistingDebateTranscript | null, metadata: DebateTranscriptMetadata) {
	if (!existing || existing.status !== 'EXTRACTED' || !existing.extracted_from_url) return false;
	return existing.extracted_from_url !== getEffectiveTranscriptUrl(metadata);
}

export function buildTranscriptMetadataUpdate(existing: ExistingDebateTranscript | null, metadata: DebateTranscriptMetadata): DebateTranscriptMetadataUpdate {
	const update: DebateTranscriptMetadataUpdate = {
		source_url: metadata.source_url,
		resolved_url: metadata.resolved_url,
		content_type: metadata.content_type,
		byte_length: metadata.byte_length
	};

	if (shouldMarkTranscriptStale(existing, metadata)) {
		update.status = 'STALE';
	}

	return update;
}
