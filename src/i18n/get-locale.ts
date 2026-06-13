import { de } from "./de";
import { en } from "./en";
import type { AppLocale, PublicDictionary } from "./types";

const dictionaries = {
  de,
  en
} satisfies Record<AppLocale, PublicDictionary>;

export function getPublicDictionary(locale: AppLocale = "de") {
  return dictionaries[locale];
}
