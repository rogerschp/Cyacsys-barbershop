const ACCENT_MAP: Record<string, string> = {
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  ä: 'a',
  å: 'a',
  è: 'e',
  é: 'e',
  ê: 'e',
  ë: 'e',
  ì: 'i',
  í: 'i',
  î: 'i',
  ï: 'i',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ö: 'o',
  ù: 'u',
  ú: 'u',
  û: 'u',
  ü: 'u',
  ñ: 'n',
  ç: 'c',
};
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x00-\x7F]/g, (c) => ACCENT_MAP[c] ?? c);
}
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 100;
export function normalizeSlug(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let s = input.trim().toLowerCase();
  s = removeAccents(s);
  s = s.replace(/[^a-z0-9\s-]/g, '');
  s = s.replace(/\s+/g, '-');
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return s;
}
export function isValidSlugFormat(slug: string): boolean {
  if (!slug || slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH)
    return false;
  return SLUG_PATTERN.test(slug);
}
