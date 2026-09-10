"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ArrowLeftRight, Info, Trash2 } from "lucide-react";
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/fantasy/i18n";
import { localize, type CompetitionPlayerView } from "@/lib/competition-types";

export type MobilePlayerSelection = {
  player: CompetitionPlayerView;
  trigger: HTMLButtonElement;
};

type Props = {
  selection: MobilePlayerSelection;
  slotId: string;
  editable: boolean;
  canSwap: boolean;
  canCaptain: boolean;
  onClose: () => void;
  onRemove: () => void;
  onSwap: () => void;
  onCaptain: () => void;
  onViceCaptain: () => void;
  onDetails: () => void;
};

export function MobilePlayerActions({
  selection,
  slotId,
  editable,
  canSwap,
  canCaptain,
  onClose,
  onRemove,
  onSwap,
  onCaptain,
  onViceCaptain,
  onDetails,
}: Props) {
  const { language } = useLanguage();
  const name = localize(selection.player.name, language);
  const english = language === "en";
  const handingOff = useRef(false);
  const [bounds, setBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    actionsLeft: number;
    actionsTop: number;
    maxHeight: number;
  } | null>(null);
  const actionCount = editable ? (canCaptain ? 5 : 3) : 1;

  useLayoutEffect(() => {
    const anchor = selection.trigger.closest<HTMLElement>(".squad-token-shell");
    if (!anchor) return;
    const viewport = window.visualViewport;
    const update = () => {
      if (
        !window.matchMedia("(width < 80rem)").matches ||
        !anchor.isConnected
      ) {
        onClose();
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportRight =
        viewportLeft + (viewport?.width ?? window.innerWidth);
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const gap = 8;
      const buttonSize = 44;
      const maxHeight = viewportHeight - gap * 2;
      const actionsHeight = Math.min(
        actionCount * (buttonSize + gap) - gap,
        maxHeight,
      );
      const left = rect.left - 4;
      const top = rect.top - 4;
      const right = rect.right + 4;
      setBounds({
        left,
        top,
        width: rect.width + 8,
        height: rect.height + 8,
        actionsLeft:
          right + gap + buttonSize <= viewportRight - gap
            ? right + gap
            : Math.max(viewportLeft + gap, left - gap - buttonSize),
        actionsTop: Math.max(
          viewportTop + gap,
          Math.min(
            rect.top + rect.height / 2 - actionsHeight / 2,
            viewportTop + viewportHeight - gap - actionsHeight,
          ),
        ),
        maxHeight,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
    };
  }, [selection, actionCount, onClose]);

  const runAction = (
    action: () => void,
    nextFocus: "player" | "vacancy" | "details" = "player",
  ) => {
    handingOff.current = nextFocus !== "player";
    onClose();
    action();
    if (nextFocus === "vacancy") {
      // Wait for React to replace the removed token with its vacant slot.
      requestAnimationFrame(() => {
        document
          .getElementById(`squad-vacancy-${slotId}`)
          ?.focus({ preventScroll: true });
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogPrimitive.Popup
          className="mobile-player-actions-modal"
          aria-describedby={undefined}
          finalFocus={() => {
            if (handingOff.current) return false;
            return selection.trigger.isConnected
              ? selection.trigger
              : document.getElementById(`squad-vacancy-${slotId}`);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <DialogTitle className="sr-only">
            {english ? `Player actions for ${name}` : `จัดการนักเตะ ${name}`}
          </DialogTitle>
          {bounds && (
            <>
              {/* The transparent spotlight reveals the original token. Its
                  button belongs to the modal, so the page stays inert. */}
              <button
                type="button"
                className="mobile-player-spotlight"
                style={{
                  left: bounds.left,
                  top: bounds.top,
                  width: bounds.width,
                  height: bounds.height,
                }}
                aria-label={
                  english
                    ? `Cancel player actions for ${name}`
                    : `ยกเลิกการจัดการ ${name}`
                }
                onClick={onClose}
              />
              <div
                className="mobile-player-actions"
                style={{
                  left: bounds.actionsLeft,
                  top: bounds.actionsTop,
                  maxHeight: bounds.maxHeight,
                }}
              >
                {editable && (
                  <>
                    <button
                      type="button"
                      className="secondary-button danger-button"
                      aria-label={english ? "Remove" : "ลบ"}
                      onClick={() => runAction(onRemove, "vacancy")}
                    >
                      <Trash2 size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      aria-label={english ? "Swap" : "สลับตัว"}
                      disabled={!canSwap}
                      onClick={() => runAction(onSwap)}
                    >
                      <ArrowLeftRight size={20} aria-hidden="true" />
                    </button>
                    {canCaptain && (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          aria-label={english ? "Captain" : "กัปตัน"}
                          onClick={() => runAction(onCaptain)}
                        >
                          <i
                            className="captain-badge captain-badge--captain dialog-captain-icon"
                            aria-hidden="true"
                          >
                            C
                          </i>
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          aria-label={english ? "Vice-captain" : "รองกัปตัน"}
                          onClick={() => runAction(onViceCaptain)}
                        >
                          <i
                            className="captain-badge captain-badge--vice-captain dialog-captain-icon"
                            aria-hidden="true"
                          >
                            V
                          </i>
                        </button>
                      </>
                    )}
                  </>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  aria-label={english ? "More information" : "ข้อมูลเพิ่มเติม"}
                  onClick={() => runAction(onDetails, "details")}
                >
                  <Info size={20} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
