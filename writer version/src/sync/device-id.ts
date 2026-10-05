const DEVICE_ID_KEY =
  'writer-device-id'

export function getDeviceId() {
  const existing =
    localStorage.getItem(
      DEVICE_ID_KEY,
    )

  if (existing) {
    return existing
  }

  const generated =
    crypto.randomUUID()

  localStorage.setItem(
    DEVICE_ID_KEY,
    generated,
  )

  return generated
}