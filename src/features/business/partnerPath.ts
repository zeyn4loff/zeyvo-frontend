export const isPartnerHost = () => window.location.hostname === "partner.zeyvo.app";

export function partnerPath(path = ""): string {
  return `${isPartnerHost() ? "" : "/partner"}${path}` || "/";
}
