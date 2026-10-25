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

/** Reads a request body, or gives up quietly if the browser cancels the request half way. */
async function readBody(req: IncomingMessage): Promise<Buffer | null> {
  const chunks: Buffer[] = []
  try {
    for await (const chunk of req) chunks.push(chunk as Buffer)
  } catch {
    return null
  }
  return Buffer.concat(chunks)
}

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

        // Browsers cancel requests all the time (React's development mode cancels the first
        // status check on purpose). A cancelled request must never take the dev server down.
        const cancelled = new AbortController()
        res.on('close', () => {
          if (!res.writableFinished) cancelled.abort()
        })

        try {
          // Loaded through Vite so the TypeScript source runs as is, and edits apply without a restart.
          const { handleAssistantRequest } = (await server.ssrLoadModule(
            '/server/assistant/handler.ts',
          )) as { handleAssistantRequest: AssistantHandler }

          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const body = hasBody ? await readBody(req) : undefined
          if (body === null) return res.end()

          const headers = new Headers()
          for (const [name, value] of Object.entries(req.headers)) {
            if (value !== undefined)
              headers.set(name, Array.isArray(value) ? value.join(', ') : value)
          }
          const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
            method: req.method,
            headers,
            body,
            signal: cancelled.signal,
          })

          const response = await handleAssistantRequest(request, env)
          if (res.destroyed) return
          res.statusCode = response.status
          response.headers.forEach((value, name) => res.setHeader(name, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          if (cancelled.signal.aborted || res.destroyed) return
          console.error(
            '[assistant] dev endpoint error:',
            error instanceof Error ? error.message : error,
          )
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json; charset=utf-8')
          }
          res.end(
            JSON.stringify({
              error: {
                code: 'failed',
                message: 'Something went wrong while answering. Please try again.',
              },
            }),
          )
        }
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
