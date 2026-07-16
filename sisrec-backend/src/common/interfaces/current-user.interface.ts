import { UserRole } from '../../generated/prisma/enums.js';

export interface CurrentUserPayload {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string;
  companyName: string;
}