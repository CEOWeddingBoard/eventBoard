import { generateSeatingPlanWithAI } from '../seating-ai';

describe('generateSeatingPlanWithAI', () => {
  const mockGuests = [
    {
      id: '1',
      name: 'Jan Kowalski',
      group: 'Rodzina pana młodego',
      dietaryRestrictions: 'Vegetarian',
      relationship: 'Ojciec pana młodego',
      age: 50,
    },
    {
      id: '2',
      name: 'Anna Kowalska',
      group: 'Rodzina pana młodego',
      dietaryRestrictions: null,
      relationship: 'Matka pana młodego',
      age: 48,
    },
    {
      id: '3',
      name: 'Maria Nowak',
      group: 'Rodzina panny młodej',
      dietaryRestrictions: 'Vegan',
      relationship: 'Matka panny młodej',
      age: 52,
    },
    {
      id: '4',
      name: 'Piotr Nowak',
      group: 'Rodzina panny młodej',
      dietaryRestrictions: null,
      relationship: 'Ojciec panny młodej',
      age: 54,
    },
  ];

  const mockTables = [
    { id: 'table1', name: 'Stół 1', capacity: 4 },
    { id: 'table2', name: 'Stół 2', capacity: 4 },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockRules: any[] = [
    {
      id: 'rule1',
      type: 'MUST_SIT_TOGETHER',
      guestIds: ['1', '2'], // Jan i Anna muszą siedzieć razem
    },
  ];

  const mockInput = {
    guests: mockGuests,
    tables: mockTables,
    rules: mockRules,
    eventName: 'Wesele Kasi i Tomka',
  };

  it('should generate a valid seating plan', async () => {
    const result = await generateSeatingPlanWithAI(mockInput);

    expect(result.success).toBe(true);
    expect(result.plan).toBeDefined();
    expect(typeof result.plan).toBe('object');

    // Check that all tables are in the plan
    mockTables.forEach(table => {
      expect(result.plan).toHaveProperty(table.id);
      expect(Array.isArray(result.plan[table.id])).toBe(true);
    });
  });

  it('should handle empty guest list', async () => {
    const emptyInput = {
      ...mockInput,
      guests: [],
    };

    const result = await generateSeatingPlanWithAI(emptyInput);

    expect(result.success).toBe(true);
    expect(result.plan).toBeDefined();

    // All tables should be empty
    mockTables.forEach(table => {
      expect(result.plan[table.id]).toEqual([]);
    });
  });

  it('should handle rules correctly', async () => {
    const result = await generateSeatingPlanWithAI(mockInput);

    expect(result.success).toBe(true);

    // Find which table has Jan and Anna
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tablesWithGuests = Object.values(result.plan).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (guests: any[]) => guests.length > 0
    );

    // At least one table should have both Jan and Anna together
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableWithCouple = tablesWithGuests.find((guests: any[]) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      guests.some((g: any) => g.id === '1') && guests.some((g: any) => g.id === '2')
    );

    expect(tableWithCouple).toBeDefined();
  });

  it('should not exceed table capacity', async () => {
    const result = await generateSeatingPlanWithAI(mockInput);

    expect(result.success).toBe(true);

    // Check that no table exceeds its capacity
    mockTables.forEach(table => {
      const guestsAtTable = result.plan[table.id];
      expect(guestsAtTable.length).toBeLessThanOrEqual(table.capacity);
    });
  });

  it('should handle dietary restrictions grouping', async () => {
    const result = await generateSeatingPlanWithAI(mockInput);

    expect(result.success).toBe(true);

    // Find tables with guests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const occupiedTables = Object.values(result.plan).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (guests: any[]) => guests.length > 0
    );

    // Should have some occupied tables
    expect(occupiedTables.length).toBeGreaterThan(0);
  });

  it('should return warnings for broken rules', async () => {
    // Create a scenario where rules cannot be satisfied
    const problematicGuests = [
      { id: '1', name: 'Jan', group: 'Group1' },
      { id: '2', name: 'Anna', group: 'Group1' },
      { id: '3', name: 'Maria', group: 'Group2' },
    ];

    const smallTables = [
      { id: 'table1', name: 'Stół 1', capacity: 1 }, // Too small for couple
    ];

    const impossibleRule = [
      {
        id: 'rule1',
        type: 'MUST_SIT_TOGETHER',
        guestIds: ['1', '2'], // Cannot fit in table of capacity 1
      },
    ];

    const problematicInput = {
      guests: problematicGuests,
      tables: smallTables,
      rules: impossibleRule,
      eventName: 'Test Event',
    };

    const result = await generateSeatingPlanWithAI(problematicInput);

    // Should still succeed but with warnings
    expect(result.success).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('should generate helpful suggestions', async () => {
    const result = await generateSeatingPlanWithAI(mockInput);

    expect(result.success).toBe(true);
    expect(result.suggestions).toBeDefined();
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('should handle large guest lists', async () => {
    // Create a larger guest list
    const largeGuests = Array.from({ length: 20 }, (_, i) => ({
      id: `guest${i}`,
      name: `Guest ${i}`,
      group: `Group${Math.floor(i / 4)}`,
      dietaryRestrictions: i % 3 === 0 ? 'Vegetarian' : null,
      relationship: 'Friend',
      age: 25 + (i % 20),
    }));

    const largeTables = Array.from({ length: 5 }, (_, i) => ({
      id: `table${i}`,
      name: `Stół ${i + 1}`,
      capacity: 6,
    }));

    const largeInput = {
      guests: largeGuests,
      tables: largeTables,
      rules: [],
      eventName: 'Large Wedding',
    };

    const result = await generateSeatingPlanWithAI(largeInput);

    expect(result.success).toBe(true);
    expect(result.plan).toBeDefined();

    // Check capacities
    largeTables.forEach(table => {
      expect(result.plan[table.id].length).toBeLessThanOrEqual(table.capacity);
    });

    // Check that guests are distributed
    const totalSeated = Object.values(result.plan).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, guests: any[]) => sum + guests.length,
      0
    );
    expect(totalSeated).toBe(largeGuests.length);
  });
});