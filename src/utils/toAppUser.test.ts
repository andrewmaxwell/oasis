import {describe, expect, it} from 'vitest';
import {toAppUser} from './toAppUser.ts';

describe('toAppUser', () => {
  it('flattens both metadata buckets', () => {
    expect(
      toAppUser({
        id: 'u1',
        email: 'amara@example.org',
        user_metadata: {name: 'Amara', notes: 'Warehouse lead'},
        app_metadata: {access_level: 'admin'},
      }),
    ).toEqual({
      id: 'u1',
      email: 'amara@example.org',
      name: 'Amara',
      notes: 'Warehouse lead',
      access_level: 'admin',
    });
  });

  it('fills every missing field with an empty string, never undefined', () => {
    // The user form is controlled; undefined would make its inputs uncontrolled.
    expect(toAppUser({id: 'u1'})).toEqual({
      id: 'u1',
      email: '',
      name: '',
      notes: '',
      access_level: '',
    });
  });

  it('takes access_level from app_metadata only', () => {
    // A level in user_metadata is self-granted and must not be honored.
    const user = {
      id: 'u1',
      user_metadata: {name: 'Mallory', access_level: 'admin'},
      app_metadata: {access_level: 'readOnly' as const},
    };
    expect(toAppUser(user).access_level).toBe('readOnly');
  });

  it('grants nothing when app_metadata has no level', () => {
    expect(
      toAppUser({id: 'u1', user_metadata: {name: 'Mallory'}}).access_level,
    ).toBe('');
  });
});
