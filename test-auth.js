const b = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://rag_user:rag_password@rag_db:5432/rag_db' });
pool.query('SELECT password_hash FROM users WHERE email=$1', ['admin@empresa.com'])
  .then(r => {
    const hash = r.rows[0]?.password_hash;
    console.log('Hash from DB:', hash ? hash.substring(0, 20) + '...' : 'NOT FOUND');
    return b.compare('Master@2026', hash);
  })
  .then(ok => { console.log('Login OK:', ok); process.exit(0); })
  .catch(e => { console.error('ERR:', e.message); process.exit(1); });
