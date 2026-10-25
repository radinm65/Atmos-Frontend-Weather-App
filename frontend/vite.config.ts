import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv } from 'vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const ASSISTANT_PATH = '/api/assistant'
type AssistantHandler = (
  request: Request,
  env: Record<string, string | undefined>,
) => Promise<Response>

/**
 * Serves the assistant endpoint during `npm run dev`, by running the same handler the deployed
 * Worker runs. Secrets come from `.env.local` (git-ignored) and stay on the dev server: they have
 * no VITE_ prefix, so Vite never sends them to the browser.
 */
function assistantDevApi(mode: string): Plugin {
  return {
    name: 'atmos-assistant-dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url || new URL(req.url, 'http://localhost').pathname !== ASSISTANT_PATH)
          return next()
        // Loaded through Vite so the TypeScript source runs as is, and edits apply without a restart.
        const { handleAssistantRequest } = (await server.ssrLoadModule(
          '/server/assistant/handler.ts',
        )) as { handleAssistantRequest: AssistantHandler }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = Buffer.concat(chunks)
        const headers = new Headers()
        for (const [name, value] of Object.entries(req.headers)) {
          if (value !== undefined)
            headers.set(name, Array.isArray(value) ? value.join(', ') : value)
        }
        const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
        const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
          method: req.method,
          headers,
          body: hasBody ? body : undefined,
        })

        const response = await handleAssistantRequest(request, env)
        res.statusCode = response.status
        response.headers.forEach((value, name) => res.setHeader(name, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), assistantDevApi(mode)],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15000,
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
}))
