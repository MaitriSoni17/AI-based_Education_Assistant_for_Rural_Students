import { User, AdminTab } from '../types';
import { FirestoreUser } from '../lib/firebase';

export type AdminPermission = 
  | 'analytics' 
  | 'analytics_export' 
  | 'content' 
  | 'certificates' 
  | 'users' 
  | 'settings';

export interface AdminPermissionDefinition {
  id: AdminPermission;
  label: string;
  shortLabel: string;
  description: string;
  tab: AdminTab;
  category: string;
}

export const ADMIN_PERMISSIONS_CATALOG: AdminPermissionDefinition[] = [
  {
    id: 'analytics',
    label: 'Analytics & Student Progress Reports',
    shortLabel: 'Analytics',
    description: 'View platform engagement, student attendance, study time, and learning curve metrics.',
    tab: 'analytics',
    category: 'Monitoring'
  },
  {
    id: 'analytics_export',
    label: 'Export Analytics Data & Backups',
    shortLabel: 'Export Data',
    description: 'Export student records, Excel reports, and full administrative JSON/CSV archives.',
    tab: 'analytics',
    category: 'Monitoring'
  },
  {
    id: 'content',
    label: 'Curriculum & Smart Reader Content',
    shortLabel: 'Curriculum',
    description: 'Create folders, upload textbook PDFs, edit study guides, and organize student library.',
    tab: 'content',
    category: 'Education'
  },
  {
    id: 'certificates',
    label: 'Certificate Registry & Issuance',
    shortLabel: 'Certificates',
    description: 'Issue official certificates to registered students, verify credentials, and manage status.',
    tab: 'certificates',
    category: 'Education'
  },
  {
    id: 'users',
    label: 'User Directory & Account Roles',
    shortLabel: 'Users & Roles',
    description: 'View registered students/teachers, modify user profiles, and manage role assignments.',
    tab: 'users',
    category: 'Administration'
  },
  {
    id: 'settings',
    label: 'Platform Settings & Bandwidth Configuration',
    shortLabel: 'System Settings',
    description: 'Configure 2G low-bandwidth mode, AI tutor rate limiting, and system parameters.',
    tab: 'settings',
    category: 'Administration'
  }
];

export const ALL_ADMIN_PERMISSION_IDS: AdminPermission[] = ADMIN_PERMISSIONS_CATALOG.map(p => p.id);

/**
 * Checks if a user is the primary System Administrator (Super Admin).
 * The System Administrator has unrestricted master privileges across all tasks.
 */
export function isUserSuperAdmin(user: User | FirestoreUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;
  if ((user as any).role === 'super_admin') return true;
  const name = (user.name || '').trim().toLowerCase();
  if (name === 'system administrator' || name.includes('system administrator')) return true;
  const standard = ((user as any).standard || '').trim().toLowerCase();
  if (standard === 'system administrator' || standard.includes('system administrator')) return true;
  return false;
}

/**
 * Parses user's permissions into an array of AdminPermission.
 * System Administrator always gets ALL permissions.
 */
export function parseAdminPermissions(user: User | FirestoreUser | null | undefined): AdminPermission[] {
  if (!user) return [];
  if (isUserSuperAdmin(user)) return [...ALL_ADMIN_PERMISSION_IDS];

  const raw = user.adminPermissions;
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw as AdminPermission[];
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as AdminPermission[];
      }
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Checks whether an admin has permission to perform a specific administrative task.
 */
export function hasAdminPermission(
  user: User | FirestoreUser | null | undefined, 
  permission: AdminPermission
): boolean {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return true;
  if (user.role !== 'admin') return false;

  const permissions = parseAdminPermissions(user);
  return permissions.includes(permission);
}

/**
 * Checks whether an admin can access a specific administrative tab.
 */
export function canAccessAdminTab(
  user: User | FirestoreUser | null | undefined, 
  tab: AdminTab
): boolean {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return true;
  if (user.role !== 'admin') return false;

  const permissions = parseAdminPermissions(user);

  switch (tab) {
    case 'analytics':
      return permissions.includes('analytics') || permissions.includes('analytics_export');
    case 'content':
      return permissions.includes('content');
    case 'certificates':
      return permissions.includes('certificates');
    case 'users':
      return permissions.includes('users');
    case 'settings':
      return permissions.includes('settings');
    default:
      return false;
  }
}
