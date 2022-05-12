db.createUser({
  user: 'mongouser',
  pwd: 'passdb',
  roles: [ { role: 'root', db: 'admin' } ],
});