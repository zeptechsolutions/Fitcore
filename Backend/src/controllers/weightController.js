import WeightLog from '../models/WeightLog.js';
import User from '../models/User.js';
import { dayRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';
import { lbToKg, withWeightLb } from '../utils/weight.js';

export async function addWeight(req, res) {
  const inputLb = Number(req.body.weightLb);
  const legacyKg = Number(req.body.weightKg);
  const weightKg = Number.isFinite(inputLb) && inputLb > 0 ? lbToKg(inputLb) : legacyKg;
  const loggedAt = req.body.loggedAt ? new Date(req.body.loggedAt) : new Date();
  if (!Number.isFinite(weightKg) || weightKg <= 0) return res.status(400).json({ message: 'Ingresá un peso válido' });
  const {start,end}=dayRange(loggedAt);
  const log = await WeightLog.findOneAndUpdate(
    {user:req.user.id,loggedAt:{$gte:start,$lte:end}},
    {user:req.user.id,weightKg,loggedAt},
    {upsert:true,returnDocument:'after',runValidators:true}
  );
  const user=await User.findById(req.user.id);
  const update={currentWeightKg:Number(weightKg)};
  if(!user?.startingWeightKg) update.startingWeightKg=Number(weightKg);
  await User.findByIdAndUpdate(req.user.id,update,{runValidators:true});
  await awardXp(req.user.id, 3);
  res.status(201).json(withWeightLb(log));
}

export async function getWeights(req, res) {
  const rows = await WeightLog.find({ user: req.user.id }).sort({ loggedAt: 1 }).lean();
  res.json(rows.map(withWeightLb));
}

export async function deleteWeight(req, res) {
  const log = await WeightLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Weight log not found' });
  const latest=await WeightLog.findOne({user:req.user.id}).sort({loggedAt:-1});
  if (latest) await User.findByIdAndUpdate(req.user.id, { currentWeightKg: latest.weightKg });
  else await User.findByIdAndUpdate(req.user.id, { $unset: { currentWeightKg: 1 } });
  res.status(204).end();
}
