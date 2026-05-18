import { ac, lecturer, student, uniAdmin, sysAdmin } from './permissions';

describe('Permissions & Access Control', () => {
  it('defines platform statements', () => {
    expect(ac.statements).toMatchObject({
      user: expect.any(Array) as unknown,
      session: expect.any(Array) as unknown,
      timetable: ['create', 'view', 'delete', 'export'],
      module: ['create', 'update', 'delete', 'view'],
      venue: ['create', 'update', 'delete', 'view'],
      analytics: ['view'],
      parseJob: ['create', 'view'],
      university: ['create', 'update', 'view'],
    });
  });

  it('keeps student limited to timetable actions', () => {
    expect(student).toEqual({
      timetable: ['create', 'view', 'delete', 'export'],
    });
    expect((student as Record<string, unknown>).module).toBeUndefined();
  });

  it('allows lecturer only module update/view and read-only venue/timetable access', () => {
    expect(lecturer).toEqual({
      module: ['update', 'view'],
      venue: ['view'],
      timetable: ['view'],
    });
    expect((lecturer as Record<string, unknown>).module).not.toContain(
      'create',
    );
    expect((lecturer as Record<string, unknown>).module).not.toContain(
      'delete',
    );
  });

  it('keeps uni_admin off university management', () => {
    expect(uniAdmin).toMatchObject({
      user: ['create', 'update', 'delete', 'view'],
      session: ['revoke'],
      module: ['create', 'update', 'delete', 'view'],
      venue: ['create', 'update', 'delete', 'view'],
      timetable: ['view'],
      analytics: ['view'],
      parseJob: ['create', 'view'],
    });
    expect((uniAdmin as Record<string, unknown>).university).toBeUndefined();
  });

  it('gives sys_admin university management', () => {
    expect(sysAdmin).toMatchObject({
      user: ['create', 'update', 'delete', 'view'],
      session: ['revoke'],
      timetable: ['create', 'view', 'delete', 'export'],
      module: ['create', 'update', 'delete', 'view'],
      venue: ['create', 'update', 'delete', 'view'],
      analytics: ['view'],
      parseJob: ['create', 'view'],
      university: ['create', 'update', 'view'],
    });
  });
});
