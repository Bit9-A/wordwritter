import { NextRequest, NextResponse } from 'next/server';
import { generateGanttExcel } from '@/lib/excel-generator';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const theme = data.ganttTheme || 'institutional';
    const buffer = await generateGanttExcel(data, theme);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="diagrama_gantt.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
