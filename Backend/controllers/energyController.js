const pool = require('../config/db');

exports.getEnergyData = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('Fetching energy data for user:', userId); // Debugging-Log

    const result = await pool.query('SELECT * FROM energy WHERE user_id = $1', [userId]);

    console.log('Energy data query result:', result.rows); // Debugging-Log

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching energy data:', err); // Debugging-Log
    res.status(500).send('Server error');
  }
};