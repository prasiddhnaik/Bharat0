import 'dotenv/config';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { handleBharatZeroApi } from '$lib/server/api/bharatzero-api';
import { createPrismaClient } from '$lib/server/db/prisma';

const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? '0.0.0.0';
const distDir = resolve(process.cwd(), 'dist');

const contentTypes: Record<string, string> = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.webmanifest': 'application/manifest+json'
};

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
	response.statusCode = statusCode;
	response.setHeader('content-type', 'application/json; charset=utf-8');
	response.end(JSON.stringify(body));
}

function sendStaticFile(response: ServerResponse, filePath: string) {
	const extension = extname(filePath);
	response.statusCode = 200;
	response.setHeader('content-type', contentTypes[extension] ?? 'application/octet-stream');
	response.setHeader(
		'cache-control',
		filePath.includes(`${join('dist', 'assets')}${process.platform === 'win32' ? '\\' : '/'}`)
			? 'public, max-age=31536000, immutable'
			: 'no-cache'
	);
	createReadStream(filePath).pipe(response);
}

function resolveStaticPath(pathname: string) {
	const decodedPath = decodeURIComponent(pathname);
	const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
	const candidatePath = resolve(distDir, `.${normalizedPath}`);

	const distDirSafe = distDir.endsWith(sep) ? distDir : distDir + sep;
	if (!candidatePath.startsWith(distDirSafe) && candidatePath !== distDir) {
		return null;
	}

	if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
		return candidatePath;
	}

	return join(distDir, 'index.html');
}

async function handleHealth(response: ServerResponse) {
	let prisma: ReturnType<typeof createPrismaClient> | null = null;

	try {
		prisma = createPrismaClient();
		const [billCount, analysisCount] = await Promise.all([prisma.bill.count(), prisma.aiBillAnalysis.count()]);
		sendJson(response, 200, {
			ok: true,
			database: 'connected',
			bills: billCount,
			aiAnalyses: analysisCount
		});
	} catch (error) {
		console.error(error);
		sendJson(response, 503, { ok: false, database: 'unavailable' });
	} finally {
		await prisma?.$disconnect();
	}
}

function setSecurityHeaders(response: ServerResponse) {
	response.setHeader('x-content-type-options', 'nosniff');
	response.setHeader('x-frame-options', 'DENY');
	response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
}

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
	setSecurityHeaders(response);
	const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

	if (url.pathname === '/api/health') {
		await handleHealth(response);
		return;
	}

	if (url.pathname.startsWith('/api/')) {
		await handleBharatZeroApi(request, response);
		return;
	}

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		sendJson(response, 405, { error: 'Method not allowed.' });
		return;
	}

	const filePath = resolveStaticPath(url.pathname);
	if (!filePath || !existsSync(filePath)) {
		sendJson(response, 404, { error: 'Not found.' });
		return;
	}

	sendStaticFile(response, filePath);
}

createServer((request, response) => {
	void handleRequest(request, response).catch((error) => {
		console.error(error);
		sendJson(response, 500, { error: 'BharatZero server error.' });
	});
}).listen(port, host, () => {
	console.log(`BharatZero server listening on http://${host}:${port}`);
});
