const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const secretKey = 'your_secret_key';

exports.registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`Registering user: ${username}`); // Debugging-Log

    // Überprüfe, ob der Benutzername bereits existiert
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length > 0) {
      console.log('Username already exists'); // Debugging-Log
      return res.status(400).send('Username already exists');
    }

    // Hash das Passwort
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Hashed password: ${hashedPassword}`); // Debugging-Log

    // Füge den neuen Benutzer hinzu
    const newUserResult = await pool.query(`
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING id
    `, [username, hashedPassword]);

    const userId = newUserResult.rows[0].id;
    console.log(`New user ID: ${userId}`); // Debugging-Log

    // Füge jedes Gebäude einmal hinzu
    const buildingsResult = await pool.query('SELECT id FROM buildings');
    const buildingPromises = buildingsResult.rows.map(building => {
      return pool.query(`
        INSERT INTO user_buildings (user_id, building_id, quantity)
        VALUES ($1, $2, 1)
      `, [userId, building.id]);
    });

    await Promise.all(buildingPromises);
    console.log('Added buildings for new user'); // Debugging-Log

    // Erstelle ein JWT-Token
    const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
    console.log(`Generated token: ${token}`); // Debugging-Log

    res.json({ token });
  } catch (err) {
    console.error('Error registering user:', err); // Debugging-Log
    res.status(500).send('Server error');
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`Logging in user: ${username}`); // Debugging-Log

    // Überprüfe, ob der Benutzer existiert
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      console.log('Invalid username or password'); // Debugging-Log
      return res.status(400).send('Invalid username or password');
    }

    const user = userResult.rows[0];

    // Überprüfe das Passwort
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log('Invalid username or password'); // Debugging-Log
      return res.status(400).send('Invalid username or password');
    }

    // Erstelle ein JWT-Token
    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
    console.log(`Generated token: ${token}`); // Debugging-Log

    res.json({ token });
  } catch (err) {
    console.error('Error logging in user:', err); // Debugging-Log
    res.status(500).send('Server error');
  }
};