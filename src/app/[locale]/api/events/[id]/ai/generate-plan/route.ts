import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, verifyEventAccess, handleApiError } from '@/lib/api/auth-helper';

// --- START AI INTEGRATION ---

interface AITask {
    title: string;
    monthsBefore: number;
    category: string;
}

interface AIBudget {
    category: string;
    percentage: number;
}

interface AIPlan {
    tasks: AITask[];
    budget: AIBudget[];
}

const OPENAI_REQUIRED_MESSAGE =
  'Aby generować plan przez AI, ustaw w pliku .env.local: AI_PROVIDER=openai oraz OPENAI_API_KEY=sk-... (klucz z platform.openai.com/api-keys).';

async function getAIGeneratedPlan(wedding: { style?: string | null; estimatedGuestCount?: number | null; targetBudget?: number | null; priorities?: string[] }): Promise<AIPlan> {
    const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (provider === 'openai') {
      if (!apiKey) {
        throw new Error(OPENAI_REQUIRED_MESSAGE);
      }
      // TODO: real OpenAI call when implementing Faza 2
    }

    // --- REAL API CALL (commented out for demonstration) ---
    /*
    if (!apiKey) {
        console.warn("OPENAI_API_KEY is not set. Using fallback data.");
        // Fallback to mock data if API key is not available
        return getMockPlan();
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            console.error("AI API call failed:", response.statusText);
            return getMockPlan(); // Fallback on API error
        }

        const data = await response.json();
        const plan = JSON.parse(data.choices[0].message.content);
        // Add validation here with Zod to ensure the AI response matches the expected structure
        return plan;

    } catch (error) {
        console.error("Error calling AI service:", error);
        return getMockPlan(); // Fallback on network or other errors
    }
    */

    // --- MOCK IMPLEMENTATION (for demonstration without API key) ---
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log("AI integration is in mock mode. Returning pre-defined plan.");
    }
    return getMockPlan(wedding);
}

function getMockPlan(wedding: { style?: string | null; estimatedGuestCount?: number | null; targetBudget?: number | null; priorities?: string[] }): AIPlan {
    // Mock plan can be slightly adjusted based on wedding style for better demo
    const isBoho = wedding.style?.toLowerCase().includes('boho');
    return {
        tasks: [
            { title: isBoho ? 'Znajdź stodołę lub plener na wesele' : 'Zarezerwuj salę weselną', monthsBefore: 12, category: 'Venue' },
            { title: 'Wybierz fotografa i kamerzystę', monthsBefore: 10, category: 'Vendors' },
            { title: 'Stwórz wstępną listę gości', monthsBefore: 9, category: 'Guests' },
            { title: 'Wybierz i zamów suknię ślubną', monthsBefore: 8, category: 'Attire' },
            { title: 'Zarezerwuj zespół muzyczny lub DJ-a', monthsBefore: 8, category: 'Vendors' },
            { title: 'Wyślij "Save the Dates"', monthsBefore: 6, category: 'Invitations' },
            { title: 'Zamów zaproszenia ślubne', monthsBefore: 5, category: 'Invitations' },
            { title: 'Wybór i degustacja tortu weselnego', monthsBefore: 4, category: 'Food' },
        ],
        budget: [
            { category: 'Sala i catering', percentage: 45 },
            { category: 'Alkohol', percentage: 10 },
            { category: 'Fotograf / Kamera', percentage: 10 },
            { category: 'Muzyka', percentage: 8 },
            { category: 'Dekoracje', percentage: isBoho ? 10 : 7 },
            { category: 'Suknia/garnitur', percentage: isBoho ? 7 : 10 },
            { category: 'Zaproszenia', percentage: 3 },
            { category: 'Rezerwa', percentage: 7 },
        ]
    };
}

// --- END AI INTEGRATION ---

function calculateDueDate(receptionDate: Date, monthsBefore: number): Date {
    const dueDate = new Date(receptionDate);
    dueDate.setMonth(dueDate.getMonth() - monthsBefore);
    return dueDate;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);

    if (!(await verifyEventAccess(user.id, id))) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || !event.date || event.targetBudget == null) {
      return NextResponse.json({ error: 'Dane wydarzenia niekompletne. Uzupełnij datę i budżet docelowy.' }, { status: 400 });
    }

    let aiGeneratedPlan: AIPlan;
    try {
      aiGeneratedPlan = await getAIGeneratedPlan({
        style: event.style,
        estimatedGuestCount: event.estimatedGuestCount,
        targetBudget: event.targetBudget ? Number(event.targetBudget) : null,
        priorities: event.priorities ? (JSON.parse(event.priorities) as string[]) : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      if (msg.includes('OPENAI_API_KEY') || msg.includes('.env.local')) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      throw err;
    }

    const ceremonyDate = new Date(event.date);
    const targetBudget = Number(event.targetBudget);

    await prisma.$transaction(async (tx) => {
      const taskData = aiGeneratedPlan.tasks.map(task => ({
        eventId: id,
        title: task.title,
        dueDate: calculateDueDate(ceremonyDate, task.monthsBefore),
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
      }));
      await tx.task.createMany({ data: taskData });

      const budgetData = aiGeneratedPlan.budget.map(item => ({
        eventId: id,
        category: item.category,
        name: `Ogólne - ${item.category}`,
        plannedAmount: (targetBudget * item.percentage) / 100,
        status: 'PLANNED' as const,
      }));
      await tx.budgetItem.createMany({ data: budgetData });
    });

    return NextResponse.json({ message: 'Initial plan generated successfully.' }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}
