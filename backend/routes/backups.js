const express = require('express');
const router = express.Router();

// GET /api/backups - mock backup list for dashboard compatibility
router.get('/', (req, res) => {
  res.json([
    { _id: '1', name: 'Backup 1', date: new Date().toISOString() },
    { _id: '2', name: 'Backup 2', date: new Date(Date.now() - 86400000).toISOString() }
  ]);
});

module.exports = router;
