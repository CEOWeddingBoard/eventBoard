import { generateWeddingTasks } from '../task-generator';

describe('generateWeddingTasks', () => {
  it('should generate tasks for a valid date', () => {
    const ceremonyDate = new Date('2025-08-15T14:00:00Z');
    const tasks = generateWeddingTasks(ceremonyDate);
    
    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    
    // Check that tasks are sorted by due date
    for (let i = 1; i < tasks.length; i++) {
      expect(tasks[i].dueDate.getTime()).toBeGreaterThanOrEqual(tasks[i-1].dueDate.getTime());
    }
    
    // Check task structure
    const firstTask = tasks[0];
    expect(firstTask).toHaveProperty('title');
    expect(firstTask).toHaveProperty('dueDate');
    expect(firstTask).toHaveProperty('category');
    expect(firstTask).toHaveProperty('priority');
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(firstTask.priority);
  });

  it('should throw error for invalid date', () => {
    expect(() => generateWeddingTasks(new Date('invalid'))).toThrow('Invalid ceremony date provided.');
  });
});
