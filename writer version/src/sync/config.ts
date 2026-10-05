const DEFAULT_SYNC_API_URL =
  'http://localhost:3001'

const DEFAULT_WORKSPACE_ID =
  'writer-test'

export function getSyncApiUrl() {
  return (
    import.meta.env
      .VITE_SYNC_API_URL ??
    DEFAULT_SYNC_API_URL
  )
}

export function getWorkspaceId() {
  return (
    import.meta.env
      .VITE_SYNC_WORKSPACE_ID ??
    DEFAULT_WORKSPACE_ID
  )
}