import { isAppRole, assertAppRole } from './roles';

describe('Role Validators', () => {
  describe('isAppRole', () => {
    it('should accept valid student role', () => {
      expect(isAppRole('student')).toBe(true);
    });

    it('should accept valid uni_admin role', () => {
      expect(isAppRole('uni_admin')).toBe(true);
    });

    it('should accept valid sys_admin role', () => {
      expect(isAppRole('sys_admin')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(isAppRole('invalid')).toBe(false);
      expect(isAppRole('admin')).toBe(false);
      expect(isAppRole('superuser')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isAppRole(123)).toBe(false);
      expect(isAppRole(null)).toBe(false);
      expect(isAppRole(undefined)).toBe(false);
      expect(isAppRole({})).toBe(false);
    });
  });

  describe('assertAppRole', () => {
    it('should return role when valid', () => {
      expect(assertAppRole('student')).toBe('student');
      expect(assertAppRole('uni_admin')).toBe('uni_admin');
      expect(assertAppRole('sys_admin')).toBe('sys_admin');
    });

    it('should throw error for invalid roles', () => {
      expect(() => assertAppRole('invalid')).toThrow();
      expect(() => assertAppRole('superuser')).toThrow();
    });

    it('should throw error for non-string values', () => {
      expect(() => assertAppRole(123)).toThrow();
      expect(() => assertAppRole(null)).toThrow();
      expect(() => assertAppRole(undefined)).toThrow();
    });

    it('should preserve type safety', () => {
      const role = assertAppRole('student');
      // At runtime, role is guaranteed to be one of the valid types
      expect(['student', 'uni_admin', 'sys_admin']).toContain(role);
    });
  });
});
