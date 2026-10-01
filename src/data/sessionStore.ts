import type { Session } from '../domain/session'

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  return (dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('kickcount', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('sessions', { keyPath: 'date' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }))
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function store(mode: IDBTransactionMode = 'readonly') {
  return (await open()).transaction('sessions', mode).objectStore('sessions')
}

export const sessionStore = {
  async getLatest(): Promise<Session | undefined> {
    const cursor = await wrap((await store()).openCursor(null, 'prev'))
    return cursor?.value
  },
  async getByDate(date: string): Promise<Session | undefined> {
    return wrap((await store()).get(date))
  },
  async getAll(): Promise<Session[]> {
    return wrap((await store()).getAll())
  },
  async save(s: Session) {
    await wrap((await store('readwrite')).put(s))
  },
  async remove(date: string) {
    await wrap((await store('readwrite')).delete(date))
  },
}

export const requestPersist = () => navigator.storage?.persist?.()