const TAG_PL: Record<string, string> = {
  NEW_LOWER_PRICE: "NOWA NIŻSZA CENA",
  LOWEST_PRICE: "NAJNIŻSZA CENA",
  NEW: "NOWOŚĆ",
  LAST_CHANCE: "OSTATNIA SZANSA",
  MORE_OPTIONS: "WIĘCEJ OPCJI",
  TOP_SELLER: "BESTSELLER",
};

export function translateTag(tag: string): string {
  return TAG_PL[tag] ?? tag.replace(/_/g, " ");
}
