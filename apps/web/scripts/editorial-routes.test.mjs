import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editorialRoutes } from './editorial-routes.mjs';
test('new editorial routes resolve imported IDs without place-specific mappings', () => {
  const routes = editorialRoutes([{ id: 'new-route', ad: 'Walk', sure: '~12 dk', mesafe: '0,8 km', duraklar: ['editorial-folder', 'new-site'] }], {
    sites: [{ id: 'api-id', photos: [{ file: 'eserler/editorial-folder/photo.jpg' }] }], routes: [],
  });
  assert.deepEqual(routes[0].siteIds, ['api-id', 'new-site']);
  assert.equal(routes[0].minutes, 12);
  assert.equal(routes[0].distance, '0,8 km');
});
test('missing duration retains imported duration', () => {
  assert.equal(editorialRoutes([{ id: 'r', ad: 'Walk' }], { sites: [], routes: [{ id: 'r', minutes: 9 }] })[0].minutes, 9);
});
test('an editorial route replaces the imported one with its id or name; the others stay', () => {
  const routes = editorialRoutes([{ id: 'hanlar-bolgesi', ad: 'Hanlar' }], {
    sites: [], routes: [{ id: 'hanlar', name: 'Hanlar', minutes: 9 }, { id: 'akar-hayrat', name: 'Akar ve Hayrat' }],
  });
  assert.deepEqual(routes.map((r) => r.id), ['hanlar-bolgesi', 'akar-hayrat']);
  assert.equal(routes[0].minutes, 9);
});
