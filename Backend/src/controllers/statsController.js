import DailySnapshot from '../models/DailySnapshot.js';
import WeightLog from '../models/WeightLog.js';
import Meal from '../models/Meal.js';
import WaterLog from '../models/WaterLog.js';
import GymLog from '../models/GymLog.js';
import ActivityLog from '../models/ActivityLog.js';
import SleepLog from '../models/SleepLog.js';
import User from '../models/User.js';
import { dayRange, weekRange } from '../utils/date.js';
import { consecutiveDays } from '../utils/streaks.js';
import { kgToLb } from '../utils/weight.js';

const rowMeters=(x)=>Number.isFinite(Number(x.distanceMeters))?Number(x.distanceMeters):Number(x.distanceKm||0)*1000;
function monthRange(dateInput=new Date()){const d=new Date(dateInput);return{start:new Date(d.getFullYear(),d.getMonth(),1),end:new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999)}}
function rangeFor(period,date){return period==='month'?monthRange(date):weekRange(date)}

export async function getSummary(req,res){
 const period=req.query.period||'week'; let range=rangeFor(period,req.query.date||new Date());
 if(period==='custom'){if(!req.query.from||!req.query.to)return res.status(400).json({message:'from and to are required for custom period'});range={start:new Date(req.query.from),end:new Date(req.query.to)}}
 const [snapshots,weights,activity,sleep,user]=await Promise.all([DailySnapshot.find({user:req.user.id,day:{$gte:range.start,$lte:range.end}}).sort({day:1}),WeightLog.find({user:req.user.id,loggedAt:{$gte:range.start,$lte:range.end}}).sort({loggedAt:1}),ActivityLog.find({user:req.user.id,loggedAt:{$gte:range.start,$lte:range.end}}),SleepLog.find({user:req.user.id,loggedAt:{$gte:range.start,$lte:range.end}}),User.findById(req.user.id)]);
 const days=snapshots.length; const sums=snapshots.reduce((a,x)=>({score:a.score+x.score,calories:a.calories+x.nutrition.calories,protein:a.protein+x.nutrition.protein,carbs:a.carbs+x.nutrition.carbs,fats:a.fats+x.nutrition.fats,water:a.water+x.waterLiters,gym:a.gym+(x.gymDone?1:0),proteinMet:a.proteinMet+(x.proteinGoalMet?1:0),waterMet:a.waterMet+(x.waterGoalMet?1:0)}),{score:0,calories:0,protein:0,carbs:0,fats:0,water:0,gym:0,proteinMet:0,waterMet:0});
 const activityDays=new Map(); for(const row of activity){const key=dayRange(row.loggedAt).start.getTime();activityDays.set(key,(activityDays.get(key)||0)+rowMeters(row))}
 const sleepDays=new Map(); for(const row of sleep){const key=dayRange(row.loggedAt).start.getTime();sleepDays.set(key,(sleepDays.get(key)||0)+Number(row.hours||0))}
 const totalMeters=[...activityDays.values()].reduce((a,b)=>a+b,0); const totalSleep=[...sleepDays.values()].reduce((a,b)=>a+b,0); const goalMeters=user?.dailyDistanceGoalMeters||5000;
 const distanceGoalDays=[...activityDays.values()].filter(v=>v>=goalMeters).length; const sleepGoalDays=[...sleepDays.values()].filter(v=>v>=(user?.sleepGoalHours||8)*.95).length; const avg=v=>days?Number((v/days).toFixed(1)):0;
 res.json({period,from:range.start,to:range.end,trackedDays:days,averages:{score:avg(sums.score),calories:avg(sums.calories),protein:avg(sums.protein),carbs:avg(sums.carbs),fats:avg(sums.fats),waterLiters:avg(sums.water),distanceMeters:activityDays.size?Math.round(totalMeters/activityDays.size):0,distanceKm:activityDays.size?Number((totalMeters/activityDays.size/1000).toFixed(2)):0,sleepHours:sleepDays.size?Number((totalSleep/sleepDays.size).toFixed(2)):0},totals:{distanceMeters:Math.round(totalMeters),distanceKm:Number((totalMeters/1000).toFixed(2)),sleepHours:Number(totalSleep.toFixed(2))},completions:{gymDays:sums.gym,proteinGoalDays:sums.proteinMet,waterGoalDays:sums.waterMet,distanceGoalDays,sleepGoalDays},weight:weights.length?{firstLb:kgToLb(weights[0].weightKg),lastLb:kgToLb(weights.at(-1).weightKg),changeLb:kgToLb(weights.at(-1).weightKg-weights[0].weightKg,2)}:null});
}

export async function getCalendar(req,res){const {start,end}=monthRange(req.query.date||new Date());const rows=await DailySnapshot.find({user:req.user.id,day:{$gte:start,$lte:end}}).sort({day:1});res.json(rows.map(x=>({date:x.day,score:x.score,calories:x.nutrition.calories,protein:x.nutrition.protein,waterLiters:x.waterLiters,distanceMeters:x.distanceMeters||Number(x.distanceKm||0)*1000,sleepHours:x.sleepHours||0,gymDone:x.gymDone,mealCount:x.mealCount})))}

export async function getStreaks(req,res){
 const user=await User.findById(req.user.id); const since=new Date();since.setDate(since.getDate()-365);
 const [meals,gym,snapshots,activity,sleep]=await Promise.all([Meal.find({user:req.user.id,loggedAt:{$gte:since}}).select('loggedAt'),GymLog.find({user:req.user.id,completedAt:{$gte:since}}).select('completedAt'),DailySnapshot.find({user:req.user.id,day:{$gte:since}}).select('day proteinGoalMet waterGoalMet score'),ActivityLog.find({user:req.user.id,loggedAt:{$gte:since}}),SleepLog.find({user:req.user.id,loggedAt:{$gte:since}}).select('loggedAt hours')]);
 const uniqueMealDays=[...new Map(meals.map(x=>[dayRange(x.loggedAt).start.getTime(),dayRange(x.loggedAt).start])).values()]; const proteinDays=snapshots.filter(x=>x.proteinGoalMet).map(x=>x.day); const waterDays=snapshots.filter(x=>x.waterGoalMet).map(x=>x.day); const scoreDays=snapshots.filter(x=>x.score>=80).map(x=>x.day);
 const weekKeys=new Map();for(const log of gym){const {start}=weekRange(log.completedAt);weekKeys.set(start.getTime(),(weekKeys.get(start.getTime())||0)+1)}
 let gymWeeks=0;if((user.weeklyGymGoal||0)>0){const completedSet=new Set([...weekKeys.entries()].filter(([,c])=>c>=user.weeklyGymGoal).map(([ts])=>ts));let cursor=weekRange(new Date()).start;while(completedSet.has(cursor.getTime())){gymWeeks++;const prev=new Date(cursor);prev.setDate(prev.getDate()-7);cursor=prev}}
 const activityByDay=new Map();for(const row of activity){const key=dayRange(row.loggedAt).start.getTime();activityByDay.set(key,(activityByDay.get(key)||0)+rowMeters(row))}
 const sleepByDay=new Map();for(const row of sleep){const key=dayRange(row.loggedAt).start.getTime();sleepByDay.set(key,(sleepByDay.get(key)||0)+Number(row.hours||0))}
 const distanceDays=[...activityByDay.entries()].filter(([,m])=>m>=(user.dailyDistanceGoalMeters||5000)).map(([ts])=>new Date(Number(ts))); const sleepDays=[...sleepByDay.entries()].filter(([,h])=>h>=(user.sleepGoalHours||8)*.95).map(([ts])=>new Date(Number(ts)));
 res.json({mealLoggingDays:consecutiveDays(uniqueMealDays),proteinGoalDays:consecutiveDays(proteinDays),waterGoalDays:consecutiveDays(waterDays),score80Days:consecutiveDays(scoreDays),distanceGoalDays:consecutiveDays(distanceDays),sleepGoalDays:consecutiveDays(sleepDays),gymGoalWeeks:gymWeeks});
}
