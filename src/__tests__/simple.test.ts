describe('Simple test suite', () => {
  test('basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('task generator function exists', async () => {
    const taskGenerator = await import('@/lib/ai/task-generator');
    expect(typeof taskGenerator.generateWeddingTasks).toBe('function');
  });
});
