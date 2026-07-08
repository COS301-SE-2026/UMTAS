import { isRole, assertRole } from './roles';

describe('Role Validators', () => {
  describe('isRole', () => {
    it('should accept valid student role', () => {
      expect(isRole('student')).toBe(true);
    });

    it('should accept valid uni_admin role', () => {
      expect(isRole('uni_admin')).toBe(true);
    });

    it('should accept valid sys_admin role', () => {
      expect(isRole('sys_admin')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(isRole('invalid')).toBe(false);
      expect(isRole('admin')).toBe(false);
      expect(isRole('superuser')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isRole(123)).toBe(false);
      expect(isRole(null)).toBe(false);
      expect(isRole(undefined)).toBe(false);
      expect(isRole({})).toBe(false);
    });
  });

  describe('assertRole', () => {
    it('should return role when valid', () => {
      expect(assertRole('student')).toBe('student');
      expect(assertRole('uni_admin')).toBe('uni_admin');
      expect(assertRole('sys_admin')).toBe('sys_admin');
    });

    it('should throw error for invalid roles', () => {
      expect(() => assertRole('invalid')).toThrow();
      expect(() => assertRole('superuser')).toThrow();
    });

    it('should throw error for non-string values', () => {
      expect(() => assertRole(123)).toThrow();
      expect(() => assertRole(null)).toThrow();
      expect(() => assertRole(undefined)).toThrow();
    });

    it('should preserve type safety', () => {
      const role = assertRole('student');
      // At runtime, role is guaranteed to be one of the valid types
      expect([
        'user',
        'sys_admin',
        'student',
        'uni_admin',
        'lecturer',
        'uni_admin_pending',
        'lecturer_pending',
      ]).toContain(role);
    });
  });
});
