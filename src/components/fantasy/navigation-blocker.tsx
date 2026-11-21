"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/fantasy/i18n";

type NavigationEvent = {
  preventDefault: () => void;
};

type NavigationBlockerContextValue = {
  setNavigationBlocked: (blocked: boolean) => void;
  requestNavigation: (event: NavigationEvent, href: string) => boolean;
};

const NavigationBlockerContext =
  createContext<NavigationBlockerContextValue | null>(null);

export function NavigationBlockerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { translate } = useLanguage();
  const [isBlocked, setIsBlocked] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const setNavigationBlocked = useCallback((blocked: boolean) => {
    setIsBlocked(blocked);
  }, []);

  const requestNavigation = useCallback(
    (event: NavigationEvent, href: string) => {
      if (!isBlocked) return true;
      event.preventDefault();
      setPendingHref(href);
      return false;
    },
    [isBlocked],
  );

  const value = useMemo(
    () => ({ setNavigationBlocked, requestNavigation }),
    [requestNavigation, setNavigationBlocked],
  );

  const leavePage = () => {
    if (!pendingHref) return;
    setIsBlocked(false);
    router.push(pendingHref);
    setPendingHref(null);
  };

  return (
    <NavigationBlockerContext.Provider value={value}>
      {children}
      <Dialog
        open={pendingHref !== null}
        onOpenChange={(open) => !open && setPendingHref(null)}
      >
        <DialogContent className="product-dialog" closeLabel={translate("ปิด")}>
          <DialogHeader>
            <DialogTitle>
              {translate("ยังไม่ได้บันทึกการเปลี่ยนแปลง")}
            </DialogTitle>
            <DialogDescription>
              {translate(
                pathname.startsWith("/admin/")
                  ? "ข้อมูลที่แก้ไขจะหายไป หากออกจากหน้านี้โดยไม่บันทึก"
                  : "การเปลี่ยนแปลงทีมของคุณจะหายไป หากออกจากหน้านี้โดยไม่บันทึก",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="modal-actions border-t-0">
            <DialogClose render={<Button variant="outline" />}>
              {translate("อยู่หน้านี้ต่อ")}
            </DialogClose>
            <Button variant="destructive" onClick={leavePage}>
              {translate("ออกจากหน้านี้")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error(
      "useNavigationBlocker must be used within NavigationBlockerProvider",
    );
  }
  return context;
}
