import { getServerEnv } from '$lib/server/env';

const GEMMA_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const DEFAULT_GEMMA_MODEL = 'gemma-4-31b-it';
const REQUEST_TIMEOUT_MS = 45_000;

export type AiAnalysisProvider = 'gemma';

export type OpenAiCompatibleChatMessage = {
	role: 'system' | 'user';
	content: string;
};

export type OpenAiCompatibleChatResponse = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	error?: {
		message?: string;
	};
};

export type OpenAiCompatibleCompletionOptions = {
	temperature?: number;
	maxCompletionTokens?: number;
	responseFormat?: 'json_object' | 'text';
};

export function normalizeProvider(value: string | null | undefined): AiAnalysisProvider | null {
	if (value === 'gemma') return value;
	return null;
}

export function getAiAnalysisProvider(requestedProvider?: string | null): AiAnalysisProvider {
	return (
		normalizeProvider(requestedProvider ?? undefined) ??
		normalizeProvider(getServerEnv('AI_ANALYSIS_PROVIDER')) ??
		'gemma'
	);
}

export function getProviderApiKey(provider: AiAnalysisProvider) {
	return provider === 'gemma' ? (getServerEnv('GEMMA_API_KEY') ?? getServerEnv('GEMINI_API_KEY')) : undefined;
}

export function isProviderConfigured(provider: AiAnalysisProvider) {
	return Boolean(getProviderApiKey(provider));
}

export function getConfiguredAiAnalysisProviders(requestedProvider?: string | null): AiAnalysisProvider[] {
	const provider = getAiAnalysisProvider(requestedProvider);
	return isProviderConfigured(provider) ? [provider] : [];
}

export function getGemmaModel() {
	return getServerEnv('GEMMA_MODEL') ?? DEFAULT_GEMMA_MODEL;
}

export function getProviderChatCompletionsUrl(_provider: AiAnalysisProvider) {
	const configuredBaseUrl = getServerEnv('GEMMA_BASE_URL') ?? getServerEnv('GEMINI_OPENAI_BASE_URL');
	const baseUrl = (configuredBaseUrl ?? GEMMA_OPENAI_BASE_URL).replace(/\/+$/, '');
	return baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
}

export async function requestOpenAiCompatibleCompletion(
	provider: AiAnalysisProvider,
	apiKey: string,
	model: string,
	messages: OpenAiCompatibleChatMessage[],
	options: OpenAiCompatibleCompletionOptions = {}
): Promise<OpenAiCompatibleChatResponse> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(getProviderChatCompletionsUrl(provider), {
			method: 'POST',
			headers: {
				authorization: `Bearer ${apiKey}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model,
				messages,
				...(options.responseFormat ? { response_format: { type: options.responseFormat } } : {}),
				...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
				...(options.maxCompletionTokens !== undefined ? { max_completion_tokens: options.maxCompletionTokens } : {})
			}),
			signal: controller.signal
		});

		const body = (await response.json().catch(() => ({}))) as OpenAiCompatibleChatResponse;
		if (!response.ok) {
			throw new Error(body.error?.message ?? `${provider} request failed with HTTP ${response.status}.`);
		}

		return body;
	} finally {
		clearTimeout(timeout);
	}
}
