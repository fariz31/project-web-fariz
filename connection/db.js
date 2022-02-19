const {Pool} = require('pg')

const dbPool = new Pool({
    database: 'personal-web',
    port: 5433,
    user: 'postgres',
    password: 'rozy'
})

module.exports = dbPool
