import { GMO_PRESTAMOS_ADMIN_PHONE } from '../config/appCompany';
import { digitsOnly } from './phone';

/** Last 10 digits — '+52 662 473 7005' and '6624737005' are the same person. */
const last10 = (phone: string) => digitsOnly(phone).slice(-10);

/** Whether this phone is the GMO Prestamos platform administrator's. */
export const isPlatformAdminPhone = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  const d = last10(phone);
  return d.length === 10 && d === last10(GMO_PRESTAMOS_ADMIN_PHONE);
};
