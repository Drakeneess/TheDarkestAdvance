const ORIGIN_PATTERN =
  /^[a-z][a-z0-9+.-]*:\/\/[^/]+$/i

export function getWriterCorsOrigins(
  rawValue =
    process.env.WRITER_CORS_ORIGINS,
) {
  if (!rawValue) {
    throw new Error(
      'WRITER_CORS_ORIGINS no está configurada',
    )
  }

  const origins =
    rawValue
      .split(',')
      .map(
        (origin) =>
          origin.trim(),
      )
      .filter(Boolean)

  if (origins.length === 0) {
    throw new Error(
      'WRITER_CORS_ORIGINS debe contener al menos un origen',
    )
  }

  for (const origin of origins) {
    if (
      origin === '*'
      || !ORIGIN_PATTERN.test(origin)
    ) {
      throw new Error(
        `Origen CORS inválido: ${origin}`,
      )
    }
  }

  return [
    ...new Set(origins),
  ]
}
