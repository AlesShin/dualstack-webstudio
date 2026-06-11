import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const devPortalStoreFile = path.resolve(__dirname, 'portal-data/portal-store.json')

function normalizeDeletedIds(value: unknown) {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')),
  )
}

function normalizePortalStorePayload(payload: any) {
  const candidate = payload?.store && typeof payload.store === 'object' ? payload.store : payload

  if (!candidate || !Array.isArray(candidate.clients)) {
    return null
  }

  return applyDevTombstones({
    currentUser: null,
    clients: candidate.clients,
    deletedClientIds: normalizeDeletedIds(candidate.deletedClientIds),
    deletedProjectIds: normalizeDeletedIds(candidate.deletedProjectIds),
    deletedMessageIds: normalizeDeletedIds(candidate.deletedMessageIds),
  })
}

function readDevPortalStore() {
  const emptyStore = {
    currentUser: null,
    clients: [],
    deletedClientIds: [],
    deletedProjectIds: [],
    deletedMessageIds: [],
  }

  try {
    if (!fs.existsSync(devPortalStoreFile)) {
      return emptyStore
    }

    const parsed = JSON.parse(fs.readFileSync(devPortalStoreFile, 'utf8'))
    return normalizePortalStorePayload(parsed) ?? emptyStore
  } catch {
    return emptyStore
  }
}

function writeDevPortalStore(store: {
  currentUser: null
  clients: unknown[]
  deletedClientIds?: string[]
  deletedProjectIds?: string[]
  deletedMessageIds?: string[]
}) {
  fs.mkdirSync(path.dirname(devPortalStoreFile), { recursive: true })
  fs.writeFileSync(devPortalStoreFile, JSON.stringify(store, null, 2))
}

function asObject(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, any> : null
}

function nestedString(value: unknown, pathParts: string[]) {
  let cursor: unknown = value

  for (const key of pathParts) {
    const objectValue = asObject(cursor)
    if (!objectValue || typeof objectValue[key] === 'undefined') return ''
    cursor = objectValue[key]
  }

  return typeof cursor === 'string' ? cursor : ''
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizePhone(value: unknown) {
  return typeof value === 'string' ? value.replace(/[^\d+]/g, '') : ''
}

function timestampValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 0
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function messageTimestamp(message: unknown) {
  const candidate = asObject(message)
  if (!candidate) return 0
  return Math.max(timestampValue(candidate.createdAt), timestampValue(candidate.editedAt))
}

function projectTimestamp(project: unknown) {
  return timestampValue(asObject(project)?.updatedAt)
}

function sessionTimestamp(session: unknown) {
  const candidate = asObject(session)
  if (!candidate) return 0
  const projectTimestamps = Array.isArray(candidate.projects)
    ? candidate.projects.map(projectTimestamp)
    : []
  const messageTimestamps = Array.isArray(candidate.messages)
    ? candidate.messages.map(messageTimestamp)
    : []

  return Math.max(
    timestampValue(candidate.createdAt),
    timestampValue(candidate.updatedAt),
    ...projectTimestamps,
    ...messageTimestamps,
  )
}

function findMatchingClientIndex(clients: unknown[], session: unknown) {
  const sessionId = nestedString(session, ['user', 'id'])
  const sessionEmail = normalizeEmail(nestedString(session, ['user', 'email']))
  const sessionPhone = normalizePhone(nestedString(session, ['user', 'phone']))

  return clients.findIndex((client) => {
    const clientId = nestedString(client, ['user', 'id'])
    const clientEmail = normalizeEmail(nestedString(client, ['user', 'email']))
    const clientPhone = normalizePhone(nestedString(client, ['user', 'phone']))

    return (
      Boolean(sessionId && clientId === sessionId) ||
      Boolean(sessionEmail && clientEmail === sessionEmail) ||
      Boolean(sessionPhone && clientPhone === sessionPhone)
    )
  })
}

function mergeProjects(existingProjects: unknown[], incomingProjects: unknown[], deletedProjectIds: string[]) {
  const projects = new Map<string, unknown>()

  existingProjects.forEach((project, index) => {
    const projectId = nestedString(project, ['id'])
    if (projectId && deletedProjectIds.includes(projectId)) return
    projects.set(projectId || `existing-${index}`, project)
  })

  incomingProjects.forEach((project, index) => {
    const projectId = nestedString(project, ['id'])
    if (projectId && deletedProjectIds.includes(projectId)) return
    const key = projectId || `incoming-${index}`
    const existing = projects.get(key)

    if (!existing || projectTimestamp(project) >= projectTimestamp(existing)) {
      projects.set(key, project)
    }
  })

  return Array.from(projects.values())
}

function mergeMessages(existingMessages: unknown[], incomingMessages: unknown[], deletedMessageIds: string[]) {
  const messages = new Map<string, unknown>()

  existingMessages.forEach((message, index) => {
    const messageId = nestedString(message, ['id'])
    if (messageId && deletedMessageIds.includes(messageId)) return
    messages.set(messageId || `existing-${index}`, message)
  })

  incomingMessages.forEach((message, index) => {
    const messageId = nestedString(message, ['id'])
    if (messageId && deletedMessageIds.includes(messageId)) return
    const key = messageId || `incoming-${index}`
    const existing = messages.get(key)

    if (!existing || messageTimestamp(message) >= messageTimestamp(existing)) {
      messages.set(key, message)
    }
  })

  return Array.from(messages.values()).sort((left, right) => messageTimestamp(left) - messageTimestamp(right))
}

function mergeClientSession(
  existingSession: unknown,
  incomingSession: unknown,
  deletedProjectIds: string[],
  deletedMessageIds: string[],
) {
  const existing = asObject(existingSession) ?? {}
  const incoming = asObject(incomingSession) ?? {}
  const existingTimestamp = sessionTimestamp(existing)
  const incomingTimestamp = sessionTimestamp(incoming)
  const base = incomingTimestamp >= existingTimestamp ? incoming : existing

  return {
    ...base,
    user: base.user ?? existing.user ?? incoming.user ?? {},
    createdAt: existing.createdAt ?? incoming.createdAt ?? new Date().toISOString(),
    updatedAt: base.updatedAt ?? new Date().toISOString(),
    authPassword:
      incomingTimestamp >= existingTimestamp && Object.prototype.hasOwnProperty.call(incoming, 'authPassword')
        ? incoming.authPassword
        : base.authPassword,
    leadGoal:
      incomingTimestamp >= existingTimestamp
        ? Object.prototype.hasOwnProperty.call(incoming, 'leadGoal')
          ? incoming.leadGoal
          : undefined
        : base.leadGoal,
    projects: mergeProjects(
      Array.isArray(existing.projects) ? existing.projects : [],
      Array.isArray(incoming.projects) ? incoming.projects : [],
      deletedProjectIds,
    ),
    messages: mergeMessages(
      Array.isArray(existing.messages) ? existing.messages : [],
      Array.isArray(incoming.messages) ? incoming.messages : [],
      deletedMessageIds,
    ),
  }
}

function applyDevTombstones(store: {
  currentUser: null
  clients: unknown[]
  deletedClientIds?: string[]
  deletedProjectIds?: string[]
  deletedMessageIds?: string[]
}) {
  const deletedClientIds = normalizeDeletedIds(store.deletedClientIds)
  const deletedProjectIds = normalizeDeletedIds(store.deletedProjectIds)
  const deletedMessageIds = normalizeDeletedIds(store.deletedMessageIds)

  return {
    currentUser: null,
    clients: store.clients
      .filter((client) => {
        const clientId = nestedString(client, ['user', 'id'])
        return !clientId || !deletedClientIds.includes(clientId)
      })
      .map((client) => {
        const candidate = asObject(client) ?? {}
        const projects = Array.isArray(candidate.projects) ? candidate.projects : []
        const messages = Array.isArray(candidate.messages) ? candidate.messages : []

        return {
          ...candidate,
          projects: projects.filter((project) => {
            const projectId = nestedString(project, ['id'])
            return !projectId || !deletedProjectIds.includes(projectId)
          }),
          messages: messages.filter((message) => {
            const messageId = nestedString(message, ['id'])
            return !messageId || !deletedMessageIds.includes(messageId)
          }),
        }
      }),
    deletedClientIds,
    deletedProjectIds,
    deletedMessageIds,
  }
}

function mergeDevPortalStores(existingStore: ReturnType<typeof readDevPortalStore>, incomingStore: ReturnType<typeof readDevPortalStore>) {
  const deletedClientIds = normalizeDeletedIds([
    ...(existingStore.deletedClientIds ?? []),
    ...(incomingStore.deletedClientIds ?? []),
  ])
  const deletedProjectIds = normalizeDeletedIds([
    ...(existingStore.deletedProjectIds ?? []),
    ...(incomingStore.deletedProjectIds ?? []),
  ])
  const deletedMessageIds = normalizeDeletedIds([
    ...(existingStore.deletedMessageIds ?? []),
    ...(incomingStore.deletedMessageIds ?? []),
  ])
  const clients = [...existingStore.clients]

  incomingStore.clients.forEach((incomingClient) => {
    const clientId = nestedString(incomingClient, ['user', 'id'])
    if (clientId && deletedClientIds.includes(clientId)) return

    const matchingIndex = findMatchingClientIndex(clients, incomingClient)

    if (matchingIndex < 0) {
      clients.push(incomingClient)
      return
    }

    clients[matchingIndex] = mergeClientSession(
      clients[matchingIndex],
      incomingClient,
      deletedProjectIds,
      deletedMessageIds,
    )
  })

  return applyDevTombstones({
    currentUser: null,
    clients,
    deletedClientIds,
    deletedProjectIds,
    deletedMessageIds,
  })
}

function readRequestBody(req: any) {
  return new Promise<string>((resolve, reject) => {
    let body = ''

    req.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8')
    })

    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function portalStoreDevApi() {
  return {
    name: 'dualstack-portal-store-dev-api',
    configureServer(server: any) {
      server.middlewares.use('/auth/portal-store.php', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          sendJson(res, 204, { ok: true })
          return
        }

        if (req.method === 'GET') {
          const store = readDevPortalStore()
          sendJson(res, 200, {
            ok: true,
            store,
            updatedAt: fs.existsSync(devPortalStoreFile)
              ? fs.statSync(devPortalStoreFile).mtime.toISOString()
              : null,
          })
          return
        }

        if (req.method !== 'PUT' && req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
          return
        }

        try {
          const rawBody = await readRequestBody(req)
          const payload = JSON.parse(rawBody || '{}')
          const store = normalizePortalStorePayload(payload)

          if (!store) {
            sendJson(res, 422, { ok: false, error: 'invalid_store' })
            return
          }

          const nextStore = mergeDevPortalStores(readDevPortalStore(), store)

          writeDevPortalStore(nextStore)
          sendJson(res, 200, {
            ok: true,
            store: nextStore,
            updatedAt: new Date().toISOString(),
          })
        } catch {
          sendJson(res, 400, { ok: false, error: 'invalid_json' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    portalStoreDevApi(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
