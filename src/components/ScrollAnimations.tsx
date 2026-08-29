import { useEffect } from "react";

export default function ScrollAnimations() {
  useEffect(() => {
    const heroReveal = document.querySelectorAll(".hero-reveal");
    heroReveal.forEach((el, i) => {
      const elem = el as HTMLElement;
      elem.style.opacity = "0";
      elem.style.transform = "translateY(40px)";
      window.setTimeout(() => {
        elem.style.transition =
          "opacity 1.2s cubic-bezier(0.19,1,0.22,1), transform 1.2s cubic-bezier(0.19,1,0.22,1)";
        elem.style.opacity = "1";
        elem.style.transform = "translateY(0)";
      }, i * 160 + 100);
    });

    const elemsToObserve: HTMLElement[] = [];
    document.querySelectorAll(".section-reveal").forEach((el) => {
      const elem = el as HTMLElement;
      if (!elem.closest("header")) elemsToObserve.push(elem);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const elem = entry.target as HTMLElement;
          const delay = elem.style.transitionDelay
            ? parseFloat(elem.style.transitionDelay)
            : 0;
          elem.style.willChange = "opacity, transform";
          window.setTimeout(() => {
            elem.style.transition =
              "opacity 0.8s cubic-bezier(0.19,1,0.22,1), transform 0.8s cubic-bezier(0.19,1,0.22,1)";
            elem.style.opacity = "1";
            elem.style.transform = "translateY(0)";
            window.setTimeout(() => {
              elem.style.willChange = "auto";
            }, 900);
          }, delay);
          observer.unobserve(elem);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    elemsToObserve.forEach((elem) => observer.observe(elem));
    return () => observer.disconnect();
  }, []);

  return null;
}
