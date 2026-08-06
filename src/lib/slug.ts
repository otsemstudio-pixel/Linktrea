// Miroir client des règles de format imposées par la migration SQL
// (profiles_slug_length / profiles_slug_format). La liste des mots réservés
// n'est PAS dupliquée ici : elle ne vit que côté base
// (public.reserved_slugs), consultée par le trigger — voir
// SupabaseProfileStore.publish(), qui traduit le rejet de la base en
// raison 'invalid'.
const SLUG_FORMAT = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

export function isValidSlugFormat(slug: string): boolean {
  const normalized = slug.toLowerCase()
  return normalized.length >= 3 && normalized.length <= 32 && SLUG_FORMAT.test(normalized)
}

// Diacritiques Unicode combinantes (accents) laissees par normalize("NFD").
const COMBINING_DIACRITICS = /[\u0300-\u036f]/g

// Propose un slug de base à partir d'un nom saisi ("Aya Koffi N'Guessan" ->
// "aya-koffi-nguessan"). Ne garantit pas une longueur >= 3 ni la
// disponibilité — les deux sont à vérifier par l'appelant (voir
// PublishSection, qui boucle avec un suffixe numérique en cas de collision).
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '') // é -> e, ç -> c...
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}
