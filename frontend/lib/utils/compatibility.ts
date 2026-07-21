import { RoommateProfile, LifestyleHabit } from '../types';

export interface CompatibilityResult {
  score: number; // 0 to 100
  matchingHabits: LifestyleHabit[];
  conflictingHabits: LifestyleHabit[];
  isMatch: boolean;
}

export function calculateCompatibility(
  profileA: RoommateProfile,
  profileB: RoommateProfile
): CompatibilityResult {
  let score = 50; // Base score
  const matchingHabits: LifestyleHabit[] = [];
  const conflictingHabits: LifestyleHabit[] = [];

  // Age difference
  const ageDiff = Math.abs(profileA.age - profileB.age);
  if (ageDiff <= 3) score += 10;
  else if (ageDiff <= 7) score += 5;
  else score -= 10;

  // Gender preferences
  const aPrefersB = profileA.genderPreference === 'Any' || profileA.genderPreference === profileB.gender;
  const bPrefersA = profileB.genderPreference === 'Any' || profileB.genderPreference === profileA.gender;
  
  if (!aPrefersB || !bPrefersA) {
    return { score: 0, matchingHabits: [], conflictingHabits: [], isMatch: false };
  }

  // Budget compatibility (if one's budget is way lower than half of a decent 2+1 it might be hard, but let's just say they are compatible if they are looking in the same city)
  const commonCities = profileA.lookingForCity.filter(c => profileB.lookingForCity.includes(c));
  if (commonCities.length === 0) {
     return { score: 0, matchingHabits: [], conflictingHabits: [], isMatch: false };
  } else {
     score += 10;
  }

  // Habits comparison
  const habitsA = new Set(profileA.habits);
  const habitsB = new Set(profileB.habits);

  const checkHabitMatch = (habit: LifestyleHabit, opposite: LifestyleHabit) => {
    const aHasHabit = habitsA.has(habit);
    const bHasHabit = habitsB.has(habit);
    const aHasOpposite = habitsA.has(opposite);
    const bHasOpposite = habitsB.has(opposite);

    if (aHasHabit && bHasHabit) {
      score += 5;
      matchingHabits.push(habit);
    } else if ((aHasHabit && bHasOpposite) || (bHasHabit && aHasOpposite)) {
      score -= 10;
      conflictingHabits.push(habit, opposite);
    }
  };

  checkHabitMatch('Early Bird', 'Night Owl');
  checkHabitMatch('Smoker', 'Non-smoker');
  checkHabitMatch('Pet Friendly', 'No Pets');
  checkHabitMatch('Social', 'Quiet');
  
  // Independent positive habits
  const independentHabits: LifestyleHabit[] = ['Tidy', 'Relaxed'];
  independentHabits.forEach(habit => {
    if (habitsA.has(habit) && habitsB.has(habit)) {
      score += 5;
      matchingHabits.push(habit);
    }
  });

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    matchingHabits,
    conflictingHabits,
    isMatch: score >= 60
  };
}
