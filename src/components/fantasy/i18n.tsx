"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { getInitialInterfaceLanguage } from "@/lib/auth/preferences";
import {
  commonMessages,
  commonTranslations,
  type CommonMessageKey,
} from "@/lib/i18n/common";
export type Language = "th" | "en";

const positionLabels: Record<Language, Record<string, string>> = {
  th: {
    GK: "ผู้รักษาประตู",
    DEF: "กองหลัง",
    MID: "กองกลาง",
    FWD: "กองหน้า",
    goalkeeper: "ผู้รักษาประตู",
    defender: "กองหลัง",
    midfielder: "กองกลาง",
    forward: "กองหน้า",
  },
  en: {
    GK: "Goalkeeper",
    DEF: "Defender",
    MID: "Midfielder",
    FWD: "Forward",
    goalkeeper: "Goalkeeper",
    defender: "Defender",
    midfielder: "Midfielder",
    forward: "Forward",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (text: string) => string;
  message: (key: CommonMessageKey) => string;
};

const translateCommonEnglish = (text: string) =>
  commonTranslations[text] ?? text;

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage = null,
  translateEnglish = translateCommonEnglish,
  onLanguageChange,
}: {
  children: ReactNode;
  initialLanguage?: Language | null;
  translateEnglish?: (text: string) => string;
  onLanguageChange?: (language: Language) => void;
}) {
  const [language, setLanguageState] = useState<Language>(
    initialLanguage ?? "th",
  );

  useEffect(() => {
    if (initialLanguage) {
      const frame = window.requestAnimationFrame(() =>
        setLanguageState(initialLanguage),
      );
      return () => window.cancelAnimationFrame(frame);
    }
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem("thai-fantasy-language");
    } catch {
      /* Keep the default when storage is blocked. */
    }
    const preferred = getInitialInterfaceLanguage(stored);
    document.cookie = `thai-fantasy-language=${preferred}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    if (stored === "en") onLanguageChange?.(preferred);
    const frame = window.requestAnimationFrame(() =>
      setLanguageState(preferred),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [initialLanguage, onLanguageChange]);

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      try {
        window.localStorage.setItem("thai-fantasy-language", nextLanguage);
      } catch {
        /* Device storage may be disabled. */
      }
      document.cookie = `thai-fantasy-language=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      onLanguageChange?.(nextLanguage);
      document.documentElement.lang = nextLanguage;
    },
    [onLanguageChange],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      translate: language === "en" ? translateEnglish : (text) => text,
      message: (key) => commonMessages[key][language],
    }),
    [language, translateEnglish, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function TranslationNamespace({
  children,
  dictionary,
}: {
  children: ReactNode;
  dictionary: Record<string, string>;
}) {
  const context = useLanguage();
  const entries = useMemo(
    () => Object.entries(dictionary).sort(([a], [b]) => b.length - a.length),
    [dictionary],
  );
  const value = useMemo(
    () => ({
      ...context,
      translate: (text: string) => {
        if (context.language !== "en") return text;
        if (dictionary[text]) return dictionary[text];
        let translated = text;
        for (const [source, target] of entries)
          if (translated.includes(source))
            translated = translated.replaceAll(source, target);
        return context.translate(translated);
      },
    }),
    [context, dictionary, entries],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function getLocalizedPositionLabel(
  position: string,
  language: Language,
) {
  return positionLabels[language][position] ?? position;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

function localizeNode(
  node: ReactNode,
  translate: (text: string) => string,
): ReactNode {
  if (typeof node === "string") return translate(node);
  if (typeof node === "number" || node == null || typeof node === "boolean")
    return node;
  if (Array.isArray(node))
    return Children.map(node, (child) => localizeNode(child, translate));

  if (isValidElement(node)) {
    const element = node as ReactElement<Record<string, unknown>>;
    if (element.props["data-localize"] === "off") return element;
    const localizedProps: Record<string, unknown> = {};
    for (const key of [
      "placeholder",
      "aria-label",
      "title",
      "defaultValue",
    ] as const) {
      const value = element.props[key];
      if (typeof value === "string") localizedProps[key] = translate(value);
    }
    if ("children" in element.props) {
      localizedProps.children = localizeNode(
        element.props.children as ReactNode,
        translate,
      );
    }
    return cloneElement(element, localizedProps);
  }

  return node;
}

const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function Localized({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const { translate } = useLanguage();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    clientSnapshot,
    serverSnapshot,
  );
  // RSC children can be opaque/lazy during SSR but resolved in the browser.
  // Preserve source text for both SSR and each boundary's first hydration;
  // only walk the tree once React has attached to the server-rendered HTML.
  return (
    <>{enabled && hydrated ? localizeNode(children, translate) : children}</>
  );
}

export function LanguageSwitcher({
  disabled = false,
  describedBy,
  onValueChange,
}: {
  disabled?: boolean;
  describedBy?: string;
  onValueChange?: (language: Language) => void;
} = {}) {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className="language-switcher"
      role="radiogroup"
      aria-label="Language"
      aria-describedby={describedBy}
    >
      <label
        className={
          language === "th" ? "language-option active" : "language-option"
        }
      >
        <input
          type="radio"
          name="interface-language"
          value="th"
          checked={language === "th"}
          disabled={disabled}
          onChange={() => {
            if (language === "th" || disabled) return;
            if (onValueChange) onValueChange("th");
            else setLanguage("th");
          }}
        />
        <span>ไทย</span>
      </label>
      <label
        className={
          language === "en" ? "language-option active" : "language-option"
        }
      >
        <input
          type="radio"
          name="interface-language"
          value="en"
          checked={language === "en"}
          disabled={disabled}
          onChange={() => {
            if (language === "en" || disabled) return;
            if (onValueChange) onValueChange("en");
            else setLanguage("en");
          }}
        />
        <span>English</span>
      </label>
    </div>
  );
}
