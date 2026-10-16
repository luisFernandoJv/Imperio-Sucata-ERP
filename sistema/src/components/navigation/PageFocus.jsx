import { useEffect, useRef } from "react";

export default function PageFocus({ pageKey, children }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return;
      const heading = rootRef.current?.querySelector("h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      } else
        document.getElementById("main-content")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pageKey]);
  return (
    <div ref={rootRef} className="route-content">
      {children}
    </div>
  );
}
