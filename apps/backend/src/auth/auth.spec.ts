import { mapGoogleProfileToUser } from './auth';

describe('mapGoogleProfileToUser', () => {
  it('maps full profile with all fields', () => {
    const result = mapGoogleProfileToUser({
      name: 'Alice Smith',
      email: 'alice@example.com',
      picture: 'https://example.com/pic.jpg',
    });
    expect(result).toEqual({
      name: 'Alice Smith',
      email: 'alice@example.com',
      image: 'https://example.com/pic.jpg',
    });
  });

  it('falls back to email prefix when name missing', () => {
    const result = mapGoogleProfileToUser({
      email: 'bob@example.com',
    });
    expect(result.name).toBe('bob');
    expect(result.image).toBeUndefined();
  });

  it('returns empty strings when name and email both missing', () => {
    const result = mapGoogleProfileToUser({});
    expect(result.name).toBe('');
    expect(result.email).toBe('');
  });

  it('ignores non-string picture', () => {
    const result = mapGoogleProfileToUser({
      name: 'Charlie',
      email: 'charlie@example.com',
      picture: 42,
    });
    expect(result.image).toBeUndefined();
  });
});
