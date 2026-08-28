"use client";

import { toast, Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      duration={4500}
      gap={10}
      visibleToasts={3}
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}
      icons={{
        success: <CircleCheckIcon size={18} strokeWidth={2.2} />,
        info: <InfoIcon size={18} strokeWidth={2.2} />,
        warning: <TriangleAlertIcon size={18} strokeWidth={2.2} />,
        error: <OctagonXIcon size={18} strokeWidth={2.2} />,
        loading: <Loader2Icon className="animate-spin" size={18} />,
        close: <XIcon size={14} strokeWidth={2.2} />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: "ปิดการแจ้งเตือน / Dismiss notification",
        classNames: {
          toast: "cn-toast",
          title: "cn-toast-title",
          description: "cn-toast-description",
          content: "cn-toast-content",
          icon: "cn-toast-icon",
          closeButton: "cn-toast-close",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
