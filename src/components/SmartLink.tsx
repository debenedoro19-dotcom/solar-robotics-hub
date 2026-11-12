import type * as React from "react";
import { Link } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useTeslaLoader } from "@/components/TeslaLoader";

interface SmartLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  ctaLoader?: boolean;
  loaderLabel?: string;
}

/**
 * Renders a client-side router link for internal paths and a plain anchor for
 * hash links, mailto/tel and external URLs. When `ctaLoader` is enabled, triggers
 * the bespoke Tesla emblem loading display before navigation.
 */
export default function SmartLink({
  href,
  children,
  prefetch: _prefetch,
  replace,
  scroll: _scroll,
  ctaLoader = false,
  loaderLabel,
  onClick,
  ...rest
}: SmartLinkProps) {
  const { navigateWithLoader } = useTeslaLoader();
  const isInternal =
    href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/");

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (ctaLoader) {
      e.preventDefault();
      navigateWithLoader(href, loaderLabel);
    }
  };

  if (!isInternal) {
    const isExternal = href.startsWith("http");
    return (
      <a
        href={href}
        onClick={ctaLoader && !isExternal ? handleCtaClick : onClick}
        {...(isExternal ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  const [path, hash] = href.split("#");

  const linkProps = {
    to: (path || "/") as never,
    ...(hash ? { hash } : {}),
    ...(replace ? { replace: true } : {}),
    onClick: handleCtaClick,
    ...rest,
  } as Record<string, unknown>;

  const AnyLink = Link as unknown as (
    props: Record<string, unknown>,
  ) => React.ReactElement;

  return <AnyLink {...linkProps}>{children}</AnyLink>;
}
