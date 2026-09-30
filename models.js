const mongoose = require('mongoose');
const { Schema } = mongoose;

const villageSchema = new Schema({
  name: { type: String, required: true },
  district: { type: String, required: true }
});

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['STATE', 'DISTRICT', 'VILLAGE'], required: true },
  district: String,                                   // only for district officers
  village: { type: Schema.Types.ObjectId, ref: 'Village' } // only for village users
});

const deviceSchema = new Schema({
  deviceId: { type: String, unique: true },
  apiKey: String,
  village: { type: Schema.Types.ObjectId, ref: 'Village' },
  district: String,
  gps: { lat: Number, lng: Number }
});

const resultSchema = new Schema({
  deviceId: String,
  village: { type: Schema.Types.ObjectId, ref: 'Village', index: true },
  district: String,
  gps: { lat: Number, lng: Number },
  ph: Number,
  fluoride: Number,
  nitrate: Number,
  chlorine: Number,
  testedAt: { type: Date, default: Date.now },
  isSafe: Boolean,
  operator: String
});

// most queries are "latest first" inside one district or village
resultSchema.index({ district: 1, testedAt: -1 });
resultSchema.index({ village: 1, testedAt: -1 });
resultSchema.index({ testedAt: -1 });

// limits for drinking water - please cross check with the BIS / WHO tables
function checkSafe(r) {
  return r.ph >= 6.5 && r.ph <= 8.5 &&
    r.fluoride <= 1.5 &&
    r.nitrate <= 45 &&
    r.chlorine >= 0.2;
}

module.exports = {
  Village: mongoose.model('Village', villageSchema),
  User: mongoose.model('User', userSchema),
  Device: mongoose.model('Device', deviceSchema),
  Result: mongoose.model('Result', resultSchema),
  checkSafe
};
