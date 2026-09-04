"use client";

import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/fantasy/i18n";

const isDevelopment = process.env.NODE_ENV === "development";
const storageKey = "thai-fantasy-language-tester";
const viewportInset = 8;

type Position = {
  left: number;
  top: number;
};

type DragState = Position & {
  pointerId: number;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
  moved: boolean;
};

function DraggableLanguageTester() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const ignoreClickRef = useRef(false);
  const [position, setPosition] = useState<Position | null>(null);
  const { language, setLanguage } = useLanguage();
  const nextLanguage = language === "th" ? "en" : "th";
  const label = language === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย";

  const constrainPosition = (
    left: number,
    top: number,
    width: number,
    height: number,
  ): Position => ({
    left: Math.min(
      Math.max(viewportInset, left),
      Math.max(viewportInset, window.innerWidth - width - viewportInset),
    ),
    top: Math.min(
      Math.max(viewportInset, top),
      Math.max(viewportInset, window.innerHeight - height - viewportInset),
    ),
  });

  useEffect(() => {
    const restorePosition = () => {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;

      try {
        const parsed: unknown = JSON.parse(stored);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          !("left" in parsed) ||
          !("top" in parsed) ||
          typeof parsed.left !== "number" ||
          typeof parsed.top !== "number"
        ) {
          return;
        }

        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPosition(
          constrainPosition(parsed.left, parsed.top, rect.width, rect.height),
        );
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    };

    restorePosition();
    window.addEventListener("resize", restorePosition);
    return () => window.removeEventListener("resize", restorePosition);
  }, []);

  const moveButton = (clientX: number, clientY: number) => {
    const drag = dragRef.current;
    const button = buttonRef.current;
    if (!drag || !button) return;

    const next = constrainPosition(
      drag.startLeft + clientX - drag.startX,
      drag.startTop + clientY - drag.startY,
      button.offsetWidth,
      button.offsetHeight,
    );
    drag.left = next.left;
    drag.top = next.top;
    setPosition(next);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className="development-language-tester"
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startLeft: rect.left,
          startTop: rect.top,
          left: rect.left,
          top: rect.top,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;

        if (
          !drag.moved &&
          Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >
            4
        ) {
          drag.moved = true;
        }
        if (drag.moved) moveButton(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;

        if (drag.moved) {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify({ left: drag.left, top: drag.top }),
          );
          ignoreClickRef.current = true;
        }
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
      onClick={() => {
        if (ignoreClickRef.current) {
          ignoreClickRef.current = false;
          return;
        }
        setLanguage(nextLanguage);
      }}
      aria-label={label}
      title={label}
      style={
        position
          ? {
              left: position.left,
              top: position.top,
              right: "auto",
              bottom: "auto",
            }
          : undefined
      }
    >
      {nextLanguage.toUpperCase()}
    </button>
  );
}

/** Development-only tool; it is intentionally unavailable from production builds. */
export function DevelopmentLanguageTester() {
  if (!isDevelopment) return null;
  return <DraggableLanguageTester />;
}
