import ExcelJS from 'exceljs';

interface GanttTask {
  descripcion: string;
  semanas: number[];
}

interface GanttActivity {
  descripcion: string;
  tareas: GanttTask[];
}

interface GanttObjective {
  objetivo: string;
  actividades: GanttActivity[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    headerBg: string;
    headerText: string;
    subHeaderBg: string;
    subHeaderText: string;
    barColor: string;
    borderColor: string;
    objText: string;
    actText: string;
  };
  layout: 'classic' | 'minimal' | 'modern';
}

export const THEMES: Record<string, ThemeConfig> = {
  institutional: {
    id: 'institutional',
    name: 'Institucional (Rojo)',
    colors: {
      headerBg: 'FFFF00', // Amarillo vibrante
      headerText: '000000',
      subHeaderBg: 'F9FAFB', 
      subHeaderText: '000000',
      barColor: 'FF0000', // Rojo vibrante
      borderColor: '000000',
      objText: '000000',
      actText: '333333',
    },
    layout: 'classic'
  },
  corporate: {
    id: 'corporate',
    name: 'Corporativo (Azul)',
    colors: {
      headerBg: '002060',
      headerText: 'FFFFFF',
      subHeaderBg: 'D9EAD3',
      subHeaderText: '000000',
      barColor: '4472C4',
      borderColor: 'BFBFBF',
      objText: '002060',
      actText: '595959',
    },
    layout: 'modern'
  },
  academic: {
    id: 'academic',
    name: 'Académico (Verde)',
    colors: {
      headerBg: '008000',
      headerText: 'FFFFFF',
      subHeaderBg: 'FDE9D9',
      subHeaderText: '000000',
      barColor: '34A853',
      borderColor: '7F7F7F',
      objText: '1E4D2B',
      actText: '404040',
    },
    layout: 'minimal'
  },
  modern: {
    id: 'modern',
    name: 'Moderno (Premium)',
    colors: {
      headerBg: '4F46E5',
      headerText: 'FFFFFF',
      subHeaderBg: 'F1F5F9',
      subHeaderText: '000000',
      barColor: '7C3AED',
      borderColor: 'E2E8F0',
      objText: '1E293B',
      actText: '64748B',
    },
    layout: 'modern'
  }
};

export async function generateGanttExcel(data: any, themeId: string = 'institutional') {
  const theme = THEMES[themeId] || THEMES.institutional;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Diagrama de Gantt', {
    pageSetup: { 
      orientation: 'landscape', 
      fitToPage: true, 
      fitToWidth: 1, 
      margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0.1, footer: 0.1 } 
    }
  });

  // Configurar anchos de columna (A=Objetivos, B=Actividades, C=Tareas, D+=Semanas)
  worksheet.getColumn(1).width = 25; // Objetivos
  worksheet.getColumn(2).width = 25; // Actividades
  worksheet.getColumn(3).width = 40; // Tareas
  for (let i = 4; i <= 17; i++) {
    worksheet.getColumn(i).width = 4; // Semana 1-14
  }

  let currentRow = 1;

  // LAYOUT: Renderizar cabecera según tema
  if (theme.layout === 'classic') {
    renderInstitutionalHeader(worksheet, data, theme);
    currentRow = 12;
  } else if (theme.layout === 'modern') {
    renderModernHeader(worksheet, data, theme);
    currentRow = 8;
  } else {
    worksheet.mergeCells('A1:Q2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CRONOGRAMA DE ACTIVIDADES';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: theme.colors.objText } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow = 4;
  }

  // Tabla principal: Cabecera
  const tableHeaderRow = worksheet.getRow(currentRow);
  tableHeaderRow.height = 30;
  
  const col1Header = worksheet.getCell(`A${currentRow}`);
  col1Header.value = 'OBJETIVOS ESPECÍFICOS';
  applyHeaderStyle(col1Header, theme);

  const col2Header = worksheet.getCell(`B${currentRow}`);
  col2Header.value = 'ACTIVIDADES';
  applyHeaderStyle(col2Header, theme);

  const col3Header = worksheet.getCell(`C${currentRow}`);
  col3Header.value = 'TAREAS';
  applyHeaderStyle(col3Header, theme);

  // Semanas (D a Q)
  for (let i = 1; i <= 14; i++) {
    const semCell = worksheet.getCell(currentRow, i + 3);
    semCell.value = i;
    applyHeaderStyle(semCell, theme);
    semCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  
  currentRow++;

  // Datos jerárquicos de 3 niveles con Merging
  const ganttData: GanttObjective[] = data.capitulo3?.diagramaGanttData || [];

  ganttData.forEach((obj) => {
    const objStartRow = currentRow;
    
    obj.actividades.forEach((act) => {
      const actStartRow = currentRow;
      
      act.tareas.forEach((tarea) => {
        // Rellenar descripción de tarea
        const tareaCell = worksheet.getCell(`C${currentRow}`);
        tareaCell.value = tarea.descripcion;
        tareaCell.font = { name: 'Arial', size: 8 };
        tareaCell.alignment = { vertical: 'middle', wrapText: true };
        
        // Bordes de la tarea
        for (let i = 1; i <= 17; i++) {
          worksheet.getCell(currentRow, i).border = getStandardBorder(theme.colors.borderColor);
        }

        // Pintar semanas (Barras del Gantt) en columnas D a Q (4 a 17)
        for (let i = 1; i <= 14; i++) {
          const semCell = worksheet.getCell(currentRow, i + 3);
          if (tarea.semanas.includes(i)) {
            semCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: theme.colors.barColor }
            };
          }
        }
        currentRow++;
      });

      // Combinar Actividades (Columna B)
      const actEndRow = currentRow - 1;
      if (actStartRow <= actEndRow) {
        worksheet.mergeCells(`B${actStartRow}:B${actEndRow}`);
        const currentActCell = worksheet.getCell(`B${actStartRow}`);
        currentActCell.value = act.descripcion;
        currentActCell.font = { name: 'Arial', size: 9, italic: true };
        currentActCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });

    // Combinar Objetivos (Columna A)
    const objEndRow = currentRow - 1;
    if (objStartRow <= objEndRow) {
      worksheet.mergeCells(`A${objStartRow}:A${objEndRow}`);
      const currentObjCell = worksheet.getCell(`A${objStartRow}`);
      currentObjCell.value = obj.objetivo;
      currentObjCell.font = { name: 'Arial', bold: true, size: 9 };
      currentObjCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }
  });

  // Espacio para firmas
  currentRow += 2;
  renderSignatures(worksheet, currentRow, data.firmasGantt || {}, theme);

  return await workbook.xlsx.writeBuffer();
}

function renderInstitutionalHeader(worksheet: ExcelJS.Worksheet, data: any, theme: ThemeConfig) {
  const p = data.portada || {};

  worksheet.mergeCells('A1:Q1');
  const h1 = worksheet.getCell('A1');
  h1.value = 'REPÚBLICA BOLIVARIANA DE VENEZUELA';
  h1.font = { bold: true, size: 11 };
  h1.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:Q2');
  const h2 = worksheet.getCell('A2');
  h2.value = (p.institucion || 'MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN').toUpperCase();
  h2.font = { bold: true, size: 10 };
  h2.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:Q10');
  const titleBox = worksheet.getCell('A3');
  titleBox.value = `\n\nPLAN DE TRABAJO DE PASANTÍAS\nPROYECTO: ${(p.titulo || 'TITULO DEL PROYECTO').toUpperCase()}\nPASANTE: ${(p.nombres || '')} ${(p.apellidos || '')}`;
  titleBox.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  titleBox.font = { bold: true, size: 12 };
  titleBox.border = getStandardBorder(theme.colors.borderColor);
  titleBox.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
}

function renderModernHeader(worksheet: ExcelJS.Worksheet, data: any, theme: ThemeConfig) {
  const p = data.portada || {};
  
  worksheet.mergeCells('A1:K6');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `\n  PROJECT SCHEDULE / GANTT CHART\n  Client: ${(p.institucion || 'Corporate Partner')}\n  Project: ${(p.titulo || 'Implementation Plan')}`;
  titleCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.colors.headerBg } };

  worksheet.mergeCells('L1:Q6');
  const logoCell = worksheet.getCell('L1');
  logoCell.value = 'LOGO';
  logoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  logoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
  logoCell.font = { bold: true, color: { argb: '9CA3AF' } };
}

function renderSignatures(worksheet: ExcelJS.Worksheet, row: number, signatures: any, theme: ThemeConfig) {
  // Ajustado para Q columnas
  if (theme.layout === 'classic') {
    worksheet.mergeCells(`A${row}:E${row + 4}`);
    const s1 = worksheet.getCell(`A${row}`);
    s1.value = `\n\n\n__________________________\n${signatures.tutorAcademico || 'Tutor Académico'}`;
    s1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    s1.border = getStandardBorder(theme.colors.borderColor);

    worksheet.mergeCells(`F${row}:K${row + 4}`);
    const s2 = worksheet.getCell(`F${row}`);
    s2.value = `\n\n\n__________________________\n${signatures.tutorInstitucional || 'Tutor Institucional'}`;
    s2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    s2.border = getStandardBorder(theme.colors.borderColor);

    worksheet.mergeCells(`L${row}:Q${row + 4}`);
    const s3 = worksheet.getCell(`L${row}`);
    s3.value = `\n\n\n__________________________\n${signatures.pasante || 'Pasante'}`;
    s3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    s3.border = getStandardBorder(theme.colors.borderColor);
  } else {
    const roles = [
      { name: signatures.tutorAcademico || 'Tutor Académico', col: 2 },
      { name: signatures.tutorInstitucional || 'Tutor Institucional', col: 8 },
      { name: signatures.pasante || 'Pasante', col: 14 }
    ];

    roles.forEach(r => {
      const lineCell = worksheet.getCell(row + 2, r.col);
      lineCell.border = { bottom: { style: 'thin', color: { argb: theme.colors.borderColor } } };
      
      const labelCell = worksheet.getCell(row + 3, r.col);
      labelCell.value = r.name;
      labelCell.font = { size: 9, italic: true };
      labelCell.alignment = { horizontal: 'center' };
    });
  }
}

function applyHeaderStyle(cell: ExcelJS.Cell, theme: ThemeConfig) {
  cell.font = { bold: true, color: { argb: theme.colors.headerText }, size: 9 };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: theme.colors.headerBg }
  };
  cell.border = getStandardBorder(theme.colors.borderColor);
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function getStandardBorder(color: string): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } }
  };
}
