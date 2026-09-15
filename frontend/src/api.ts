import type { AssistantReply, HelpdeskResult, Lang, LendingResult, Verdict } from './types'

// Empty in the browser (Vite proxies /api). Set to an absolute https origin for the
// Android build, which has no proxy in front of it.
const BASE = import.meta.env.VITE_API_BASE ?? ''

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json() as Promise<T>
}

export const analyze = (p: {
  session_id?: string
  input_type: string
  text?: string
  image_b64?: string
  app_name?: string
  lang: Lang
  deep?: boolean
}) => post<Verdict>('/api/analyze', p)

export const investigate = (session_id: string, answer: string, lang: Lang) =>
  post<Verdict>('/api/investigate', { session_id, answer, lang })

export const assistant = (
  message: string,
  lang: Lang,
  session_id: string | undefined,
  history: { role: string; text: string }[],
) => post<AssistantReply>('/api/assistant', { message, lang, session_id, history })

export const helpdesk = (verdict: Verdict) =>
  post<HelpdeskResult>('/api/helpdesk', { verdict })

export const checkLendingApp = (app_name: string) =>
  post<LendingResult>('/api/lending-app/check', { app_name })

export const deleteSession = (id: string) =>
  fetch(`${BASE}/api/session/${id}`, { method: 'DELETE' }).then((r) => r.json())
