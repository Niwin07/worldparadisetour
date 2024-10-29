const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Asegúrate de tener dotenv configurado para cargar las variables de entorno

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const plainPassword = '12345678';
const email = 'nehuenmesiasrios07@gmail.com';

// Hashear la nueva contraseña
bcrypt.hash(plainPassword, 10, async (err, newHash) => {
  if (err) {
    console.error('Error al hashear la contraseña:', err);
  } else {
    console.log('Nuevo hash generado:', newHash);

    // Actualizar el hash en la base de datos
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query('UPDATE cliente SET password = ? WHERE Email = ?', [newHash, email]);
      console.log('Hash actualizado en la base de datos:', result);
      connection.release();
    } catch (error) {
      console.error('Error al actualizar el hash en la base de datos:', error);
    }
  }
});