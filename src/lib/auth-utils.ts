/**
 * Utility functions for authentication and authorization
 */

export type UserRole = 'user' | 'organizer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Check if a user can create events
 * @param user - The user object
 * @returns boolean indicating if user can create events
 */
export function canCreateEvents(user: User | null): boolean {
  return user !== null && (user.role === 'admin' || user.role === 'organizer');
}

/**
 * Check if a user can manage teams
 * @param user - The user object
 * @returns boolean indicating if user can manage teams
 */
export function canManageTeams(user: User | null): boolean {
  return user !== null; // All authenticated users can manage teams
}

/**
 * Check if a user can create teams
 * @param user - The user object
 * @returns boolean indicating if user can create teams
 */
export function canCreateTeams(user: User | null): boolean {
  return user !== null; // All authenticated users can create teams
}

/**
 * Check if a user has admin privileges
 * @param user - The user object
 * @returns boolean indicating if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return user !== null && user.role === 'admin';
}

/**
 * Check if a user has organizer privileges
 * @param user - The user object
 * @returns boolean indicating if user is organizer
 */
export function isOrganizer(user: User | null): boolean {
  return user !== null && user.role === 'organizer';
}

/**
 * Get user role display name
 * @param role - The user role
 * @returns formatted role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    user: 'User',
    organizer: 'Organizer',
    admin: 'Admin'
  };
  return roleNames[role];
}

/**
 * Get user role description
 * @param role - The user role
 * @returns role description
 */
export function getRoleDescription(role: UserRole): string {
  const roleDescriptions = {
    user: 'Standard access - Browse events, create and join teams',
    organizer: 'Event organizer - Create and host events, manage teams',
    admin: 'Full system access - Create events and manage everything'
  };
  return roleDescriptions[role];
}
