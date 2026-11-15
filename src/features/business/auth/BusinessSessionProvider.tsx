import { useEffect, useRef, useState, type ReactNode } from "react";
import { BusinessSessionContext } from "./business-session-context";
import { clearBusinessSession, readBusinessSession, saveBusinessSession, updateBusinessSession, type BusinessSession } from "./businessSession";
import { rememberBusinessPhone } from "./businessCredentials";
import { logoutPartner, readPartnerAccount, PartnerApiError } from "./partnerAuthApi";
import { readPartnerProfile } from "../profile/profileApi";
import { fetchBusinesses, fetchBusinessContext, saveBusinessContext } from "../directory/businessDirectoryApi";
import { clearServerBusinesses, setServerBusinesses } from "../directory/businesses";
import { hydrateActiveContext, clearServerBusinessContext } from "../directory/activeContext";
import { partnerSessionExpiredEvent } from "../api/client";

export default function BusinessSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<BusinessSession | null>(readBusinessSession);
  const sessionExpired = useRef(false);

  useEffect(() => {
    const handleExpiredSession = () => {
      sessionExpired.current = true;
      clearBusinessSession();
      if (session) {
        clearServerBusinesses(session.id);
        clearServerBusinessContext(session.id);
      }
      setSession(null);
    };
    window.addEventListener(partnerSessionExpiredEvent, handleExpiredSession);
    return () => window.removeEventListener(partnerSessionExpiredEvent, handleExpiredSession);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    Promise.all([fetchBusinesses(), fetchBusinessContext()]).then(async ([items, context]) => {
      if (!active || sessionExpired.current) return;
      setServerBusinesses(session.id, items);
      const current = items.find((item) => item.id === context.businessId);
      const validCurrent = current && context.branchId && (current.type === "individual" ? current.primaryBranchId === context.branchId : current.branches.some((branch) => branch.id === context.branchId));
      const selected = validCurrent ? current : items.find((item) => item.type === "individual" ? !!item.primaryBranchId : item.branches.length > 0);
      if (selected) {
        const serverBranchId = validCurrent ? context.branchId! : selected.type === "individual" ? selected.primaryBranchId! : selected.branches[0].id;
        if (!validCurrent) await saveBusinessContext(selected.id, serverBranchId);
        if (active && !sessionExpired.current) hydrateActiveContext(session, selected.id, selected.type === "individual" ? selected.id : serverBranchId);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    readPartnerAccount().then(async (account) => {
      if (!active || sessionExpired.current) return;
      if (!account) { clearBusinessSession(); setSession(null); }
      else {
        const profile = await readPartnerProfile().catch(() => null);
        if (!active || sessionExpired.current) return;
        const restored = { ...account, avatar: profile?.avatar ?? session.avatar ?? "", startView: profile?.startView ?? session.startView };
        saveBusinessSession(restored, true); setSession(restored);
      }
    }).catch((error) => {
      if (active && error instanceof PartnerApiError && error.status === 401) { sessionExpired.current = true; clearBusinessSession(); clearServerBusinesses(session.id); clearServerBusinessContext(session.id); setSession(null); }
    });
    return () => { active = false; };
  // Validate the restored server session once when the provider mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startSession(next: BusinessSession, remember: boolean) {
    sessionExpired.current = false;
    const restored = { ...next, avatar: next.avatar || "" };
    saveBusinessSession(restored, remember);
    if (restored.phone) rememberBusinessPhone(restored.phone);
    setSession(restored);
  }

  function endSession() {
    if (session) { void logoutPartner().catch(() => undefined); clearServerBusinesses(session.id); clearServerBusinessContext(session.id); }
    clearBusinessSession();
    setSession(null);
  }

  function updateSession(next: BusinessSession) {
    if (!updateBusinessSession(next)) return false;
    setSession(next);
    return true;
  }

  return <BusinessSessionContext.Provider value={{ session, startSession, updateSession, endSession }}>{children}</BusinessSessionContext.Provider>;
}
