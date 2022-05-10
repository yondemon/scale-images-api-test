db.createUser({
  user: 'mongouser',
  pwd: 'pass',
  roles: [
    {
      role: 'dbOwner',
      db: 'application_database',
    },
    {
      role: 'dbOwner',
      db: 'testdb',
    },
  ],
});