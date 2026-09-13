import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { requireAuth, verifyEventAccess, handleApiError } from '@/lib/api/auth-helper';

const TEMPLATE_HEADERS = ['Imię', 'Nazwisko'] as const;

const EXAMPLE_ROWS = [
  ['Anna', 'Kowalska'],
  ['Jan', 'Kowalski'],
  ['Maria', 'Nowak'],
];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth(_req);

    if (!(await verifyEventAccess(user.id, id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const csv = Papa.unparse({
      fields: [...TEMPLATE_HEADERS],
      data: EXAMPLE_ROWS,
    });

    const bom = '\uFEFF';
    const body = bom + csv;

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set(
      'Content-Disposition',
      'attachment; filename="szablon_lista_gosci.csv"'
    );

    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}
