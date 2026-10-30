"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";

type Props = ComponentProps<typeof NextLink>;

/** next/link that keeps internal links inside the current language. */
export default function Link({ href, ...rest }: Props) {
  const locale = useLocale();
  const target = typeof href === "string" ? localePath(href, locale) : href;
  return <NextLink href={target} {...rest} />;
}
