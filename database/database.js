const { Pool } = require('pg')
const pool = new Pool({
    user: 'bpenovfo',
    host: 'abul.db.elephantsql.com',
    database: 'bpenovfo',
    password: 'deFnd4Kv-U2PkzBovyK7kOx8pIH_zuy3',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
})


module.exports = pool