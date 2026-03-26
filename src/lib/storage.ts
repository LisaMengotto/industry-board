import type { BoardData } from './types'

const STORAGE_KEY = 'industryBoard.v1'

export function loadBoardData(): BoardData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, sectors: [], layout: {} }
    const parsed = JSON.parse(raw) as Partial<BoardData>
    if (!parsed || parsed.version !== 1) return { version: 1, sectors: [], layout: {} }
    return {
      version: 1,
      sectors: Array.isArray(parsed.sectors) ? (parsed.sectors as BoardData['sectors']) : [],
      layout: parsed.layout && typeof parsed.layout === 'object' ? (parsed.layout as BoardData['layout']) : {},
    }
  } catch {
    return { version: 1, sectors: [], layout: {} }
  }
}

export function saveBoardData(data: BoardData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // If localStorage is full or blocked, we silently ignore to keep the app usable.
  }
}

export function clearBoardData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

