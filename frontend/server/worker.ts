import { ASSISTANT_PATH } from '../src/lib/assistant/contract'
import { handleAssistantRequest } from './assistant/handler'
import type { AssistantEnv } from './assistant/handler'

/**
 * Cloudflare Workers entry (OPEN_DECISIONS D-15 candidate). Static files are served from the
 * `ASSETS` binding with single-page-app fallback; only `/api/assistant` runs this code. The
 * secrets are set with `wrangler secret put`, never in the repository. See wrangler.jsonc.
 */

interface Env extends AssistantEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === ASSISTANT_PATH) return handleAssistantRequest(request, env)
    return env.ASSETS.fetch(request)
  },
}
