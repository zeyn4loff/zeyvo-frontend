import { useEffect, useState } from "react";
import { type Language } from "@/features/locale/language";

export type LegalTab = "terms" | "privacy";
export interface LegalContent {
  slug: LegalTab;
  locale: Language;
  title: string;
  subtitle: string | null;
  paragraphs: string[];
  updated_at: string | null;
}

interface LegalState { key: string; content: LegalContent | null; error: boolean }
interface LegalResult { content: LegalContent | null; loading: boolean; error: boolean }

export function useLegalContent(tab: LegalTab | null, language: Language): LegalResult {
  const [state, setState] = useState<LegalState>({ key: "", content: null, error: false });
  const key = `${tab ?? ""}:${language}`;

  useEffect(() => {
    if (!tab) return;
    const controller = new AbortController();
    fetch(`/api/v1/legal/${tab}`, {
      headers: { Accept: "application/json", "Accept-Language": language },
      signal: controller.signal,
    })
      .then(async (response) => {
        const envelope = await response.json();
        if (!response.ok || !envelope.success) throw new Error("legal_content_failed");
        return envelope.data as LegalContent;
      })
      .then((content) => setState({ key, content, error: false }))
      .catch(() => { if (!controller.signal.aborted) setState({ key, content: null, error: true }); });
    return () => controller.abort();
  }, [tab, language, key]);

  return state.key === key ? { content: state.content, loading: false, error: state.error } : { content: null, loading: true, error: false };
}
