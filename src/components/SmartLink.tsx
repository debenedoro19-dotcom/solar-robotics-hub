import { Link } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

interface SmartLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

/**
 * Renders a client-side router link for internal paths and a plain anchor for
 * hash links, mailto/tel and external URLs.
 */
export default function SmartLink({
  href,
  children,
  prefetch: _prefetch,
  replace,
  scroll: _scroll,
  ...rest
}: SmartLinkProps) {
  const isInternal =
    href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/");

  if (!isInternal) {
    const isExternal = href.startsWith("http");
    return (
      <a
        href={href}
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
    ...rest,
  } as Record<string, unknown>;

  const AnyLink = Link as unknown as (
    props: Record<string, unknown>,
  ) => JSX.Element;

  return <AnyLink {...linkProps}>{children}</AnyLink>;
}
