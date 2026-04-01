import { NextRequest, NextResponse } from 'next/server';
import { generateDocument } from '@/lib/docx-generator';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const buffer = await generateDocument(data);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="documento_revisado.docx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
