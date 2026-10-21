export function normalizeSlug(
  value: string,
) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createUniqueSlug(
  value: string,
  usedSlugs: Iterable<string>,
  fallback: string,
) {
  const used =
    new Set(usedSlugs)

  const base =
    normalizeSlug(value) ||
    normalizeSlug(fallback) ||
    'untitled'

  if (!used.has(base)) {
    return base
  }

  let suffix = 2

  while (
    used.has(`${base}-${suffix}`)
  ) {
    suffix += 1
  }

  return `${base}-${suffix}`
}
