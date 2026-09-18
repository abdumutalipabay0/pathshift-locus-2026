import type { Task } from './types';
/** Route data-entry tasks to the editor section that contains the missing value. */
export function taskProfileStep(task: Pick<Task, 'id' | 'type' | 'title'>): number {
  const key = `${task.id} ${task.title}`.toLowerCase();
  if (task.type === 'SCORE' || /ielts|toefl|duolingo|english|sat\b|act\b|test score/.test(key))
    return 2;
  if (task.type === 'DOCUMENT' || task.type === 'BUDGET' || /document|aif|budget|fund/.test(key))
    return 3;
  if (/citizenship|age|country|intake/.test(key)) return 0;
  return 1;
}
