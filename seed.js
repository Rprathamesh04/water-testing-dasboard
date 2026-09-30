const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Village, User, Device, Result, checkSafe } = require('./models');

const places = {
  Nagpur: ['Kamptee', 'Hingna', 'Katol'],
  Wardha: ['Seloo', 'Arvi', 'Deoli'],
  Bhandara: ['Pauni', 'Tumsar', 'Sakoli']
};
const operators = ['Ramesh', 'Sunita', 'Amol', 'Kavita'];

const rand = (a, b) => +(a + Math.random() * (b - a)).toFixed(2);
// about 7% chance that a parameter is outside the safe limit
const bad = () => Math.random() < 0.07;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Village.deleteMany(), User.deleteMany(), Device.deleteMany(), Result.deleteMany()]);

  const password = await bcrypt.hash('demo123', 10);
  const devices = [];
  let count = 1;

  for (const district of Object.keys(places)) {
    for (const name of places[district]) {
      const village = await Village.create({ name, district });
      const device = await Device.create({
        deviceId: 'WQ-' + String(count).padStart(3, '0'),
        apiKey: 'key-' + count,
        village: village._id,
        district,
        gps: { lat: rand(20.5, 22), lng: rand(78.5, 80) }
      });
      devices.push(device);
      count++;
    }
  }

  const kamptee = await Village.findOne({ name: 'Kamptee' });
  await User.create([
    { name: 'State Officer', email: 'state@demo.com', password, role: 'STATE' },
    { name: 'Nagpur District Officer', email: 'nagpur@demo.com', password, role: 'DISTRICT', district: 'Nagpur' },
    { name: 'Wardha District Officer', email: 'wardha@demo.com', password, role: 'DISTRICT', district: 'Wardha' },
    { name: 'Kamptee Village User', email: 'kamptee@demo.com', password, role: 'VILLAGE', village: kamptee._id }
  ]);

  const results = [];
  for (let i = 0; i < 3000; i++) {
    const d = devices[Math.floor(Math.random() * devices.length)];
    const r = {
      ph: bad() ? rand(5.8, 6.4) : rand(6.6, 8.4),
      fluoride: bad() ? rand(1.6, 2.4) : rand(0.2, 1.4),
      nitrate: bad() ? rand(46, 70) : rand(5, 40),
      chlorine: bad() ? rand(0, 0.15) : rand(0.25, 0.9)
    };
    results.push({
      deviceId: d.deviceId,
      village: d.village,
      district: d.district,
      gps: d.gps,
      ...r,
      testedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      isSafe: checkSafe(r),
      operator: operators[i % operators.length]
    });
  }
  await Result.insertMany(results);

  console.log('Done. Added', results.length, 'results');
  await mongoose.disconnect();
}

run().catch(err => {
  console.log(err);
  process.exit(1);
});
