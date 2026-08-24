import GymLog from '../models/GymLog.js';
import User from '../models/User.js';
import { weekRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

function volume(log){ return (log.exercises||[]).reduce((sum,e)=>sum+Number(e.sets||0)*Number(e.reps||0)*Number(e.weightLb||0),0); }

export async function addGym(req, res) {
  const exercises = Array.isArray(req.body.exercises) ? req.body.exercises.filter(x=>String(x?.name||'').trim()).map(x=>({name:String(x.name).trim(),sets:Number(x.sets)||1,reps:Number(x.reps)||1,weightLb:Number(x.weightLb)||0})) : [];
  const log = await GymLog.create({
    user:req.user.id,
    title:String(req.body.title||'Entrenamiento').trim(),
    workoutType:req.body.workoutType||'other',
    durationMinutes:Number(req.body.durationMinutes)||0,
    perceivedEffort:req.body.perceivedEffort?Number(req.body.perceivedEffort):undefined,
    exercises,
    notes:req.body.notes,
    completedAt:req.body.completedAt
  });
  await awardXp(req.user.id, 15);
  res.status(201).json(log);
}

export async function getGymWeek(req, res) {
  const { start, end } = weekRange(req.query.date || new Date());
  const logs = await GymLog.find({ user: req.user.id, completedAt: { $gte: start, $lte: end } }).sort({ completedAt: 1 });
  const user = await User.findById(req.user.id);
  res.json({ completed: logs.length, goal: user.weeklyGymGoal, totalMinutes: logs.reduce((s,x)=>s+Number(x.durationMinutes||0),0), totalVolumeLb: logs.reduce((s,x)=>s+volume(x),0), logs });
}

export async function getGymHistory(req,res){
  const limit=Math.min(100,Math.max(1,Number(req.query.limit)||30));
  const logs=await GymLog.find({user:req.user.id}).sort({completedAt:-1}).limit(limit);
  res.json(logs);
}

export async function getGymProgress(req,res){
  const since=new Date(); since.setDate(since.getDate()-84);
  const logs=await GymLog.find({user:req.user.id,completedAt:{$gte:since}}).sort({completedAt:1});
  const weeks=new Map();
  const exerciseMap=new Map();
  for(const log of logs){
    const {start}=weekRange(log.completedAt); const key=start.toISOString().slice(0,10);
    const w=weeks.get(key)||{week:key,workouts:0,minutes:0,volumeLb:0};
    w.workouts+=1; w.minutes+=Number(log.durationMinutes||0); w.volumeLb+=volume(log); weeks.set(key,w);
    for(const e of log.exercises||[]){
      const best=exerciseMap.get(e.name)||{name:e.name,bestWeightLb:0,bestVolumeLb:0,sessions:0};
      best.bestWeightLb=Math.max(best.bestWeightLb,Number(e.weightLb||0));
      best.bestVolumeLb=Math.max(best.bestVolumeLb,Number(e.sets||0)*Number(e.reps||0)*Number(e.weightLb||0));
      best.sessions+=1; exerciseMap.set(e.name,best);
    }
  }
  res.json({weeks:[...weeks.values()],exercises:[...exerciseMap.values()].sort((a,b)=>b.sessions-a.sessions).slice(0,12)});
}

export async function deleteGym(req, res) {
  const log = await GymLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Gym log not found' });
  res.status(204).end();
}
