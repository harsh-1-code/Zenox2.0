import type { Lang, LendingResult, Verdict } from './types'

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
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

export const checkLendingApp = (app_name: string) =>
  post<LendingResult>('/api/lending-app/check', { app_name })

export const deleteSession = (id: string) =>
  fetch(`/api/session/${id}`, { method: 'DELETE' }).then((r) => r.json())
