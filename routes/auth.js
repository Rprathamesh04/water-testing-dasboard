const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Wrong email or password' });

    const ok = await bcrypt.compare(password || '', user.password);
    if (!ok) return res.status(401).json({ message: 'Wrong email or password' });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        district: user.district,
        village: user.village ? String(user.village) : undefined
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token, name: user.name, role: user.role });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
