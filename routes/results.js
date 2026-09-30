const express = require('express');
const { Village, Device, Result, checkSafe } = require('../models');
const { verifyToken, accessFilter } = require('../middleware');

const router = express.Router();

// list of results, newest first. "cursor" is used for the next page
router.get('/results', verifyToken, async (req, res) => {
  try {
    const { village, status, from, to, cursor } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    // start with the role filter, user filters are only added on top of it
    const conditions = [accessFilter(req.user)];

    if (village) conditions.push({ village });
    if (status === 'safe') conditions.push({ isSafe: true });
    if (status === 'unsafe') conditions.push({ isSafe: false });
    if (from) conditions.push({ testedAt: { $gte: new Date(from) } });
    if (to) conditions.push({ testedAt: { $lte: new Date(to + 'T23:59:59Z') } });

    if (cursor) {
      const [time, id] = cursor.split('|');
      const t = new Date(time);
      conditions.push({
        $or: [{ testedAt: { $lt: t } }, { testedAt: t, _id: { $lt: id } }]
      });
    }

    const rows = await Result.find({ $and: conditions })
      .sort({ testedAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('village', 'name')
      .lean();

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const last = rows[rows.length - 1];
    const nextCursor = hasMore ? last.testedAt.toISOString() + '|' + last._id : null;

    res.json({ rows, nextCursor });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Could not load results' });
  }
});

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const filter = accessFilter(req.user);
    const total = await Result.countDocuments(filter);
    const unsafe = await Result.countDocuments({ ...filter, isSafe: false });
    res.json({ total, unsafe });
  } catch (err) {
    res.status(500).json({ message: 'Could not load stats' });
  }
});

// villages the user is allowed to see (for the filter dropdown)
router.get('/villages', verifyToken, async (req, res) => {
  const u = req.user;
  let filter = {};
  if (u.role === 'DISTRICT') filter = { district: u.district };
  if (u.role === 'VILLAGE') filter = { _id: u.village };

  const villages = await Village.find(filter).sort('name').lean();
  res.json(villages);
});

// water testing device sends a reading here (no user login, uses device key)
router.post('/results/ingest', async (req, res) => {
  try {
    const { deviceId, ph, fluoride, nitrate, chlorine, operator } = req.body;
    const device = await Device.findOne({ deviceId, apiKey: req.headers['x-device-key'] });
    if (!device) return res.status(401).json({ message: 'Unknown device' });

    const values = [ph, fluoride, nitrate, chlorine];
    if (values.some(v => typeof v !== 'number' || isNaN(v)) || ph < 0 || ph > 14) {
      return res.status(400).json({ message: 'Invalid readings' });
    }

    const saved = await Result.create({
      deviceId: device.deviceId,
      village: device.village,
      district: device.district,
      gps: device.gps,
      ph, fluoride, nitrate, chlorine,
      operator,
      isSafe: checkSafe({ ph, fluoride, nitrate, chlorine })
    });
    res.status(201).json({ id: saved._id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Could not save reading' });
  }
});

module.exports = router;
