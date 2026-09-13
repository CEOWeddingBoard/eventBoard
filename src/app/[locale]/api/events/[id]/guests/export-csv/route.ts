import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import { authorizeRequest } from '@/lib/auth-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await authorizeRequest(req, id);
    if (authResult.error) {
      return authResult.error;
    }

    const guests = await prisma.guest.findMany({
      where: {
        household: {
          weddingId: id,
        },
      },
      include: {
        household: true,
      },
      orderBy: {
        household: {
          name: 'asc',
        },
      },
    });

    // Map the data to a flat structure suitable for CSV
    const flattenedData = guests.map(guest => ({
      'Imię': guest.firstName || '',
      'Nazwisko': guest.lastName || '',
      'Nazwa': guest.name || '',
      'Email': guest.email || '',
      'Telefon': guest.phone || '',
      'Nazwa grupy domowej': guest.household?.name || '',
      'Czy potwierdzono udział?': guest.isAttending?.toString() ?? '',
      'Status': guest.status || '',
    }));

    const fields = [
      'Imię',
      'Nazwisko',
      'Nazwa',
      'Email',
      'Telefon',
      'Nazwa grupy domowej',
      'Czy potwierdzono udział?',
      'Status',
    ];

    const csv = Papa.unparse({
        fields,
        data: flattenedData
    });

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="lista_gosci_${id}.csv"`);

    return new NextResponse(csv, { status: 200, headers });

  } catch (error) {
    const { id } = await params;
    // eslint-disable-next-line no-console
    console.error(`Error exporting guests for wedding ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
