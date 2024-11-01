const { Pool } = require('pg');

// Configure the PostgreSQL connection
const pool = new Pool({
  user: 'DB_USER',
  host: 'localhost',
  database: 'DB_NAME',
  password: 'PASSWORD',
  port: 5432, // Default PostgreSQL port
});

pool.connect((err) => {
    if (err) {
      console.error('Error connecting to PostgreSQL database:', err);
    } else {
      console.log('Connected to PostgreSQL database');
    }
});


module.exports = pool;
