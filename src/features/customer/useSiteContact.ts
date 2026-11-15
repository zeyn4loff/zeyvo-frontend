import { useEffect, useState } from "react";

interface SiteContact { phone: string; phone_href: string; email: string }

export function useSiteContact(): SiteContact | null {
  const [contact, setContact] = useState<SiteContact | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/site/contact", { headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error("contact_failed");
        return result.data as SiteContact;
      })
      .then(setContact)
      .catch(() => { if (!controller.signal.aborted) setContact(null); });
    return () => controller.abort();
  }, []);

  return contact;
}
