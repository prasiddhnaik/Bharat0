import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

function bharatZeroApiPlugin(): Plugin {
	return {
		name: 'bharatzero-api',
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				if (!request.url?.startsWith('/api/')) {
					next();
					return;
				}
				void server
					.ssrLoadModule('/src/lib/server/api/bharatzero-api.ts')
					.then(({ handleBharatZeroApi }) => handleBharatZeroApi(request, response))
					.catch((error) => {
						console.error(error);
						response.statusCode = 500;
						response.setHeader('content-type', 'application/json; charset=utf-8');
						response.end(JSON.stringify({ error: 'BharatZero API failed to load.' }));
					});
			});
		}
	};
}

export default defineConfig({
	plugins: [bharatZeroApiPlugin(), react(), tailwindcss()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	}
});
