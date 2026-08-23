import MeasurementLog from '../models/MeasurementLog.js';

const fields = ['armCm','chestCm','waistCm','hipsCm','thighCm','calfCm'];

export async function addMeasurement(req, res) {
  const hasMeasurement = fields.some((key) => req.body[key] !== undefined);
  if (!hasMeasurement) return res.status(400).json({ message: 'At least one body measurement is required' });
  const data = { user: req.user.id, notes: req.body.notes, loggedAt: req.body.loggedAt };
  for (const key of fields) if (req.body[key] !== undefined) data[key] = req.body[key];
  res.status(201).json(await MeasurementLog.create(data));
}

export async function getMeasurements(req, res) {
  const filter = { user: req.user.id };
  if (req.query.from || req.query.to) {
    filter.loggedAt = {};
    if (req.query.from) filter.loggedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.loggedAt.$lte = new Date(req.query.to);
  }
  res.json(await MeasurementLog.find(filter).sort({ loggedAt: 1 }));
}

export async function deleteMeasurement(req, res) {
  const log = await MeasurementLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Measurement not found' });
  res.status(204).end();
}
