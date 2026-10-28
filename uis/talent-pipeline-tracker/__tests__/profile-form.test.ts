import { profilePayload, profileValues } from '../lib/profile-form';

test('profile values retain contact strings and exclude identity fields', () => {
  expect(profileValues({ id: 'profile', user_id: 'user', name: ' Name ', phone: '00123', address: 'Address' }))
    .toEqual({ name: ' Name ', phone: '00123', address: 'Address' });
});

test('nullable profile contacts become empty inputs', () => {
  expect(profileValues({ id: 'profile', user_id: 'user', name: null, phone: null, address: null }))
    .toEqual({ name: '', phone: '', address: '' });
});

test('payload trims contacts without numeric conversion or identity inclusion', () => {
  const values = { name: ' Name ', phone: ' 00123 ', address: ' Address ', id: 'ignored', email: 'ignored' };
  expect(profilePayload(values)).toEqual({ name: 'Name', phone: '00123', address: 'Address' });
  expect(values.name).toBe(' Name ');
});

test('blank profile inputs explicitly clear each contact with null', () => {
  expect(profilePayload({ name: '', phone: ' ', address: '\t\n' })).toEqual({ name: null, phone: null, address: null });
});
