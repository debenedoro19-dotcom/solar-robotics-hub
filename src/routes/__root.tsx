import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/contexts/AuthContext";
import PopupManager from "@/components/PopupManager";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";
import { TeslaLoaderProvider } from "@/components/TeslaLoader";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "AQIIcSpkaiEYmk4CIq2js-pBiDP_88f3WhZiKYaaIhM" },
      { title: "Trade Tesla — Premium Tesla Ecosystem Marketplace" },
      {
        name: "description",
        content:
          "Buy, sell and invest in Tesla vehicles, energy systems, solar and robotics on a secure, high-tech marketplace.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Trade Tesla" },
      { name: "application-name", content: "Trade Tesla" },
      { name: "apple-mobile-web-app-title", content: "Trade Tesla" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "64x64" },
      { rel: "shortcut icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Trade Tesla",
          alternateName: ["Trade Tesla Energy", "Trade Tesla"],
          url: "https://tradeenergyhub.com",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Trade Tesla",
          url: "https://tradeenergyhub.com",
          logo: "https://tradeenergyhub.com/apple-touch-icon.png",
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const LOVABLE_GUARD_CSS = `
lovable-badge,
lovable-editor,
gpt-engineer,
[data-lovable-badge],
[data-lovable],
[data-lovable-editor],
[id*="lovable" i],
[class*="lovable" i],
a[href*="lovable.dev" i],
a[href*="lovable.app" i],
a[href*="lovable.ai" i],
iframe[src*="lovable" i],
button[aria-label*="lovable" i],
div:has(> a[href*="lovable.dev" i]),
div:has(> a[href*="lovable.app" i]),
div:has(> button[aria-label*="lovable" i]),
div:has(> [data-lovable-badge]),
div:has(> [data-lovable]),
div:has(> lovable-badge),
aside:has(a[href*="lovable" i]) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  position: fixed !important;
  bottom: -99999px !important;
  right: -99999px !important;
  width: 0 !important;
  height: 0 !important;
  max-width: 0 !important;
  max-height: 0 !important;
  overflow: hidden !important;
  clip-path: inset(50%) !important;
  z-index: -999999 !important;
}
`;

const PURGE_LOVABLE_SCRIPT = `
(function(){
  var RE_LOVABLE = /lovable|gpt-engineer/i;
  var RE_BADGE_TEXT = /edit\\s*with|lovable/i;

  function killNode(el) {
    if (!el || el === document.body || el === document.documentElement || el === document.head) return;
    try {
      el.style && el.style.setProperty('display', 'none', 'important');
      el.style && el.style.setProperty('visibility', 'hidden', 'important');
      el.style && el.style.setProperty('opacity', '0', 'important');
      el.style && el.style.setProperty('pointer-events', 'none', 'important');
      if (el.parentNode) el.parentNode.removeChild(el);
    } catch(e) {}
  }

  function findWidgetRoot(el) {
    var cur = el;
    var best = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (cur.id === 'root' || cur.tagName === 'MAIN' || cur.tagName === 'HEADER' || cur.tagName === 'FOOTER') break;
      try {
        var cs = window.getComputedStyle(cur);
        if (cs.position === 'fixed' || cs.position === 'absolute') {
          best = cur;
        }
      } catch(e) {}
      if ((cur.id && RE_LOVABLE.test(cur.id)) || (cur.tagName && RE_LOVABLE.test(cur.tagName))) {
        best = cur;
      }
      cur = cur.parentElement;
    }
    return best;
  }

  // 1. Block Lovable custom elements from registering
  try {
    if (typeof window !== 'undefined' && window.customElements && window.customElements.define) {
      var origDefine = window.customElements.define.bind(window.customElements);
      window.customElements.define = function(name, ctor, opts) {
        if (typeof name === 'string' && RE_LOVABLE.test(name)) {
          try {
            class InertBadge extends HTMLElement {
              connectedCallback() { killNode(this); }
            }
            return origDefine(name, InertBadge, opts);
          } catch(e) { return; }
        }
        return origDefine(name, ctor, opts);
      };
    }
  } catch(e) {}

  // 2. Intercept Shadow DOM creation to neutralize hidden shadow badges
  try {
    if (typeof Element !== 'undefined' && Element.prototype.attachShadow) {
      var origAttach = Element.prototype.attachShadow;
      Element.prototype.attachShadow = function(init) {
        var host = this;
        var root = origAttach.call(host, init);
        var hostMeta = (host.tagName || '') + ' ' + (host.id || '') + ' ' + (typeof host.className === 'string' ? host.className : '');
        if (RE_LOVABLE.test(hostMeta)) {
          killNode(findWidgetRoot(host));
          return root;
        }
        try {
          var checkShadow = function() {
            var content = (root.textContent || '') + ' ' + (root.innerHTML || '');
            if (RE_LOVABLE.test(content) || (/edit\\s*with/i.test(content) && content.length < 4000)) {
              killNode(findWidgetRoot(host));
            }
          };
          checkShadow();
          if (typeof MutationObserver !== 'undefined') {
            new MutationObserver(checkShadow).observe(root, { childList: true, subtree: true, characterData: true });
          }
        } catch(e) {}
        return root;
      };
    }
  } catch(e) {}

  // 3. Block dynamically injected Lovable badge/editor scripts & iframes
  try {
    if (typeof document !== 'undefined' && document.createElement) {
      var origCreate = document.createElement.bind(document);
      document.createElement = function(tag, opts) {
        var el = origCreate(tag, opts);
        var lower = typeof tag === 'string' ? tag.toLowerCase() : '';
        if (lower === 'script' || lower === 'iframe') {
          var origSetAttr = el.setAttribute.bind(el);
          el.setAttribute = function(k, v) {
            if (k && k.toLowerCase() === 'src' && typeof v === 'string' && RE_LOVABLE.test(v) && v.indexOf('/lovable/email') === -1) {
              return;
            }
            return origSetAttr(k, v);
          };
          try {
            var desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src') || Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
            if (desc && desc.set) {
              Object.defineProperty(el, 'src', {
                configurable: true,
                get: function() { return desc.get ? desc.get.call(this) : ''; },
                set: function(v) {
                  if (typeof v === 'string' && RE_LOVABLE.test(v) && v.indexOf('/lovable/email') === -1) return;
                  desc.set.call(this, v);
                }
              });
            }
          } catch(e) {}
        }
        return el;
      };
    }
  } catch(e) {}

  // 4. Deep DOM purger (selectors + split text nodes + bottom-right injected widgets)
  function purge() {
    try {
      var selectors = [
        'lovable-badge',
        'lovable-editor',
        'gpt-engineer',
        '#lovable-badge',
        '[data-lovable-badge]',
        '[data-lovable]',
        '[data-lovable-editor]',
        '[id*="lovable" i]',
        '[class*="lovable" i]',
        'a[href*="lovable.dev" i]',
        'a[href*="lovable.app" i]',
        'iframe[src*="lovable" i]',
        'button[aria-label*="lovable" i]'
      ];
      var matched = document.querySelectorAll(selectors.join(','));
      for (var i = 0; i < matched.length; i++) {
        killNode(findWidgetRoot(matched[i]));
      }

      // Check existing shadow roots on direct body children (injected by host proxy)
      if (document.body) {
        var bodyKids = document.body.children;
        for (var k = bodyKids.length - 1; k >= 0; k--) {
          var kid = bodyKids[k];
          if (!kid || kid.id === 'root' || kid.tagName === 'SCRIPT' || kid.tagName === 'STYLE') continue;
          var meta = (kid.tagName || '') + ' ' + (kid.id || '') + ' ' + (typeof kid.className === 'string' ? kid.className : '');
          if (RE_LOVABLE.test(meta)) {
            killNode(kid);
            continue;
          }
          if (kid.shadowRoot) {
            var sText = (kid.shadowRoot.textContent || '') + ' ' + (kid.shadowRoot.innerHTML || '');
            if (RE_LOVABLE.test(sText) || /edit\\s*with/i.test(sText)) {
              killNode(kid);
              continue;
            }
          }
          var kidText = (kid.textContent || '').trim();
          if (kidText.length > 0 && kidText.length < 120 && RE_BADGE_TEXT.test(kidText)) {
            var kidStyle = window.getComputedStyle(kid);
            if (kidStyle.position === 'fixed' || parseInt(kidStyle.zIndex, 10) >= 9000) {
              killNode(kid);
              continue;
            }
          }
          // Check fixed bottom-right floating badge or chat icon injected directly onto body
          try {
            var cs = window.getComputedStyle(kid);
            if (cs.position === 'fixed') {
              var rect = kid.getBoundingClientRect();
              var z = parseInt(cs.zIndex, 10) || 0;
              var inBottomRight = rect.width > 0 && rect.width < 280 && rect.height > 0 && rect.height < 140 &&
                (window.innerHeight - rect.bottom) < 120 && (window.innerWidth - rect.right) < 100;
              if (inBottomRight && z >= 9999 && !kid.hasAttribute('data-tesla-ui')) {
                var html = kid.innerHTML || '';
                if (RE_LOVABLE.test(html) || /edit\\s*with/i.test(html) || kid.querySelector('a[href*="lovable" i]') || kid.querySelector('button[aria-label*="Close" i], button[aria-label*="dismiss" i]')) {
                  killNode(kid);
                }
              }
            }
          } catch(e) {}
        }
      }

      // TreeWalker catches split text nodes like <span>Edit with</span><svg/><span>Lovable</span>
      if (document.body && document.createTreeWalker) {
        var walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
        var n;
        while ((n = walker.nextNode())) {
          var val = n.nodeValue;
          if (val && RE_BADGE_TEXT.test(val)) {
            var parent = n.parentElement;
            if (!parent) continue;
            var rootBox = findWidgetRoot(parent);
            if (rootBox && rootBox !== parent) {
              var boxText = (rootBox.textContent || '');
              if (boxText.length < 160 && (/lovable/i.test(boxText) || /edit\\s*with/i.test(boxText))) {
                killNode(rootBox);
              }
            } else if (/lovable/i.test(parent.textContent || '') && (parent.textContent || '').length < 80) {
              var pStyle = window.getComputedStyle(parent);
              if (pStyle.position === 'fixed' || pStyle.position === 'absolute') {
                killNode(parent);
              }
            }
          }
        }
      }
    } catch(e) {}
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', purge);
    } else {
      purge();
    }
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(purge).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    }
    setInterval(purge, 350);
  }
})();
`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style id="tt-brand-guard" dangerouslySetInnerHTML={{ __html: LOVABLE_GUARD_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: PURGE_LOVABLE_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TeslaLoaderProvider>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <PopupManager />
          </TeslaLoaderProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
