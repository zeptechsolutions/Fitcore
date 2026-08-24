import User from '../models/User.js';
import Meal from '../models/Meal.js';
import WaterLog from '../models/WaterLog.js';
import GymLog from '../models/GymLog.js';
import WeightLog from '../models/WeightLog.js';
import ActivityLog from '../models/ActivityLog.js';
import SleepLog from '../models/SleepLog.js';
import { dayRange, weekRange } from '../utils/date.js';
import { calculateDailyScore } from '../utils/score.js';
import DailySnapshot from '../models/DailySnapshot.js';

const rowMeters=(x)=>Number.isFinite(Number(x.distanceMeters))?Number(x.distanceMeters):Number(x.distanceKm||0)*1000;
export async function getDailyDashboard(req,res){
 const date=req.query.date||new Date(); const {start,end}=dayRange(date); const week=weekRange(date);
 const [user,meals,water,gymToday,gymWeek,latestWeight,activity,sleep]=await Promise.all([
  User.findById(req.user.id),Meal.find({user:req.user.id,loggedAt:{$gte:start,$lte:end}}),WaterLog.find({user:req.user.id,loggedAt:{$gte:start,$lte:end}}),
  GymLog.findOne({user:req.user.id,completedAt:{$gte:start,$lte:end}}),GymLog.countDocuments({user:req.user.id,completedAt:{$gte:week.start,$lte:week.end}}),WeightLog.findOne({user:req.user.id}).sort({loggedAt:-1}),ActivityLog.find({user:req.user.id,loggedAt:{$gte:start,$lte:end}}),SleepLog.find({user:req.user.id,loggedAt:{$gte:start,$lte:end}})
 ]);
 const totals=meals.reduce((a,m)=>({calories:a.calories+m.totals.calories,protein:a.protein+m.totals.protein,carbs:a.carbs+m.totals.carbs,fats:a.fats+m.totals.fats}),{calories:0,protein:0,carbs:0,fats:0});
 const waterLiters=water.reduce((s,x)=>s+Number(x.liters||0),0); const distanceMeters=activity.reduce((s,x)=>s+rowMeters(x),0); const sleepHours=sleep.reduce((s,x)=>s+Number(x.hours||0),0);
 const distanceGoalMeters=user.dailyDistanceGoalMeters||5000; const gymRequired=user.weeklyGymGoal>0&&gymWeek<user.weeklyGymGoal;
 const score=calculateDailyScore({totals,goals:user.macroGoals,waterLiters,waterGoal:user.waterGoalLiters,gymRequired,gymDone:Boolean(gymToday),distanceMeters,distanceGoalMeters,sleepHours,sleepGoal:user.sleepGoalHours||8});
 await DailySnapshot.findOneAndUpdate({user:req.user.id,day:start},{user:req.user.id,day:start,score,nutrition:totals,waterLiters:Number(waterLiters.toFixed(3)),distanceMeters:Math.round(distanceMeters),distanceKm:Number((distanceMeters/1000).toFixed(3)),sleepHours:Number(sleepHours.toFixed(2)),gymDone:Boolean(gymToday),mealCount:meals.length,proteinGoalMet:totals.protein>=user.macroGoals.protein*.9,waterGoalMet:waterLiters>=user.waterGoalLiters*.95,distanceGoalMet:distanceMeters>=distanceGoalMeters,sleepGoalMet:sleepHours>=(user.sleepGoalHours||8)*.95},{upsert:true,returnDocument:'after',runValidators:true});
 res.json({date:start,score,nutrition:{totals,goals:user.macroGoals},water:{liters:Number(waterLiters.toFixed(3)),goalLiters:user.waterGoalLiters,logs:water},activity:{meters:Math.round(distanceMeters),distanceKm:Number((distanceMeters/1000).toFixed(3)),goalMeters:distanceGoalMeters,logs:activity},sleep:{hours:Number(sleepHours.toFixed(2)),goalHours:user.sleepGoalHours||8,logs:sleep},meals:{count:meals.length,entries:meals},gym:{doneToday:Boolean(gymToday),completedThisWeek:gymWeek,weeklyGoal:user.weeklyGymGoal},latestWeight});
}
