const Club = require('../models/Club');

// GET /api/clubs with advanced filtering support
exports.getClubs = async (req, res) => {
  try {
    const { search, type, advisor } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) filter.type = type;
    if (advisor) filter.advisor = { $regex: advisor, $options: 'i' };

    const clubs = await Club.find(filter);
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching clubs' });
  }
};

// POST /api/clubs
exports.createClub = async (req, res) => {
  const { name, advisor } = req.body;
  if (!name || !advisor) {
    return res.status(400).json({ error: 'Name and advisor are required' });
  }

  try {
    const newClub = new Club({ name, advisor });
    await newClub.save();
    res.status(201).json(newClub);
  } catch (err) {
    res.status(500).json({ error: 'Error creating club' });
  }
};
