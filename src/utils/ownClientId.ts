import { isStaffRole } from '../config/rolePermissions';

/**
 * The clientId a page may load. Staff act for their company, so the URL's
 * clientId is honored for them. Every other session is self-service and is
 * PINNED to its own session clientId — a clientId typed into the URL
 * (/client-expediente/2165, /lender-dashboard/2165…) is ignored, so a customer
 * can never open someone else's expediente, dashboard or marketplace view.
 */
export const pinnedClientId = (
  urlClientId: string | number | undefined | null,
  sessionClientId: number,
  roleCode: string | undefined,
): number => {
  if (isStaffRole(roleCode)) {
    const fromUrl = Number(urlClientId);
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : sessionClientId;
  }
  return sessionClientId;
};
