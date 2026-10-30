"use client";

import { createContext, useContext, type ReactNode } from "react";
import { interpolate, localePath, type Locale } from "./config";

type Ctx = { locale: Locale; dict: Record<string, string> };
const LocaleContext = createContext<Ctx>({ locale: "ro", dict: {} });

export function LocaleProvider({ locale, dict, children }: { locale: Locale; dict: Record<string, string>; children: ReactNode }) {
  return <LocaleContext.Provider value={{ locale, dict }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useT() {
  const { locale, dict } = useContext(LocaleContext);
  return (ro: string, vars?: Record<string, string | number>) => interpolate(locale === "en" ? (dict[ro] ?? ro) : ro, vars);
}

export function useLp() {
  const { locale } = useContext(LocaleContext);
  return (href: string) => localePath(href, locale);
}
