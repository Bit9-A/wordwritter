import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  convertInchesToTwip,
  AlignmentType,
  PageOrientation,
  NumberFormat,
  TableOfContents,
  Footer,
  PageNumber,
  PageBreak,
  LevelFormat,
  convertMillimetersToTwip,
  Tab,
  LeaderType,
} from 'docx';
import { DocumentData } from './schema';

// ─── Constantes de formato ────────────────────────────────────────────────────
const FONT      = 'Arial';
const FONT_SIZE = 24;          // 12 pt → docx usa half-points
const BLACK     = '000000';
const LINE_15   = 360;         // 1.5 interlineado (240 twips = 1.0 single)
const INDENT_1L = convertMillimetersToTwip(12.7); // 0.5 in / 1.27 cm — sangría APA6
const PARA_SPACE_BEFORE = 0;
const PARA_SPACE_AFTER  = 0;

// Márgenes (en twips desde milímetros)
const M_STD = {
  top:    convertMillimetersToTwip(30),
  bottom: convertMillimetersToTwip(30),
  right:  convertMillimetersToTwip(30),
  left:   convertMillimetersToTwip(40),
};
const M_CHAP = {    // Inicio de capítulo/sección: 5 cm superior
  top:    convertMillimetersToTwip(50),
  bottom: convertMillimetersToTwip(30),
  right:  convertMillimetersToTwip(30),
  left:   convertMillimetersToTwip(40),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parsea texto con negritas markdown (**texto**) */
function parseMarkdownBold(text: string): TextRun[] {
  const parts: TextRun[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(new TextRun({ text: text.substring(lastIndex, match.index), font: FONT, size: FONT_SIZE, color: BLACK }));
    }
    parts.push(new TextRun({ text: match[1], font: FONT, size: FONT_SIZE, bold: true, color: BLACK }));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(new TextRun({ text: text.substring(lastIndex), font: FONT, size: FONT_SIZE, color: BLACK }));
  }

  return parts.length > 0 ? parts : [new TextRun({ text, font: FONT, size: FONT_SIZE, color: BLACK })];
}

/** Párrafo de texto normal (justificado, SIN sangría, sin espacio extra) */
function bodyParagraph(text: string, opts?: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] }): Paragraph {
  return new Paragraph({
    style: 'BodyText',
    alignment: opts?.alignment ?? AlignmentType.JUSTIFIED,
    children: parseMarkdownBold(text),
    spacing: { line: LINE_15, before: PARA_SPACE_BEFORE, after: PARA_SPACE_AFTER },
  });
}

/** Párrafo de texto normal a partir de partes ya procesadas (p. ej. Glosario) */
function bodyMultiRun(children: TextRun[], opts?: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] }): Paragraph {
  return new Paragraph({
    style: 'BodyText',
    alignment: opts?.alignment ?? AlignmentType.JUSTIFIED,
    children,
    spacing: { line: LINE_15, before: PARA_SPACE_BEFORE, after: PARA_SPACE_AFTER },
  });
}

/** Salto de página */
function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

/** Heading 1: MAYÚSCULAS, centrado, sin sangría, nivel TOC 1 */
function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: FONT_SIZE, bold: true, color: BLACK })],
    spacing: { line: LINE_15, before: 0, after: 0 },
  });
}

/** Heading 2: Negrilla, alineado izquierda, sin sangría, nivel TOC 2 */
function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE, bold: true, color: BLACK })],
    spacing: { line: LINE_15, before: convertMillimetersToTwip(6), after: 0 },
  });
}

/** Pie de página con número centrado */
function pageFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT,
            size: FONT_SIZE,
            color: BLACK,
          }),
        ],
      }),
    ],
  });
}

/** Convierte texto con saltos de línea en array de Paragraph */
function textToParas(text: string): Paragraph[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => bodyParagraph(line));
}

// ─── Función principal ────────────────────────────────────────────────────────
export async function generateDocument(data: DocumentData): Promise<Document> {

  const doc = new Document({
    features: {
      updateFields: true, // Fuerza actualización de campos (TOC) al abrir
    },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE, color: BLACK },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: LINE_15, before: 0, after: 0 },
          },
        },
      },
      paragraphStyles: [
        // Body Text — estilo base para párrafos normales
        {
          id: 'BodyText',
          name: 'Body Text',
          basedOn: 'Normal',
          run: { font: FONT, size: FONT_SIZE, color: BLACK },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: LINE_15, before: 0, after: 0 },
          },
        },
        // Heading 1 — personalizado para que coincida con requerimientos
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'BodyText',
          run: { font: FONT, size: FONT_SIZE, bold: true, color: BLACK },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: 0, after: 0 },
            outlineLevel: 0,
          },
        },
        // Heading 2 — personalizado
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'BodyText',
          run: { font: FONT, size: FONT_SIZE, bold: true, color: BLACK },
          paragraph: {
            alignment: AlignmentType.LEFT,
            spacing: { line: LINE_15, before: convertMillimetersToTwip(6), after: 0 },
            outlineLevel: 1,
          },
        },
      ],
    },

    sections: [

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 1: PORTADA  (sin numeración)
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: M_STD,
          },
        },
        children: [
          // Membrete institucional
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: 'REPÚBLICA BOLIVARIANA DE VENEZUELA', font: FONT, size: FONT_SIZE, bold: true, color: BLACK })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: 'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA', font: FONT, size: FONT_SIZE, color: BLACK })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: 'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA DE LA FUERZA ARMADA NACIONAL', font: FONT, size: FONT_SIZE, color: BLACK })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: 'UNEFA – NÚCLEO TÁCHIRA', font: FONT, size: FONT_SIZE, color: BLACK })],
          }),

          // Espacio central
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(60), after: 0 }, children: [new TextRun('')] }),

          // Título del proyecto
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: data.portada.tituloProyecto.toUpperCase(), font: FONT, size: FONT_SIZE, bold: true, color: BLACK })],
          }),

          // Espacio hacia datos del autor
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(80), after: 0 }, children: [new TextRun('')] }),

          // Datos del pasante (alineados a la derecha)
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: `Autor: ${data.portada.nombres} ${data.portada.apellidos}`, font: FONT, size: FONT_SIZE, color: BLACK })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: `Cédula de Identidad: V- ${data.portada.cedula}`, font: FONT, size: FONT_SIZE, color: BLACK })],
          }),

          // Espacio al pie
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(60), after: 0 }, children: [new TextRun('')] }),

          // Ciudad y fecha
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: 0, after: 0 },
            children: [new TextRun({ text: `${data.portada.ciudad ?? 'San Cristóbal'}, ${data.portada.fechaMes} de ${data.portada.fechaAno}`, font: FONT, size: FONT_SIZE, color: BLACK })],
          }),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 2: PÁGINAS PRELIMINARES  (numeración romana)
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: M_CHAP,
            pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
          },
        },
        footers: { default: pageFooter() },
        children: [

          // ── Acta Institucional ──────────────────────────────────
          heading1('ACTA DE EVALUACIÓN INSTITUCIONAL'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...textToParas(data.actasEvaluacion.actaInstitucional),
          pageBreak(),

          // ── Acta Académica ──────────────────────────────────────
          heading1('ACTA DE EVALUACIÓN ACADÉMICA'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...textToParas(data.actasEvaluacion.actaAcademica),
          pageBreak(),

          // ── Acta del Jurado ─────────────────────────────────────
          heading1('ACTA DE EVALUACIÓN DEL JURADO'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...textToParas(data.actasEvaluacion.actaEvaluador),
          pageBreak(),

          // ── Índice de Contenido ─────────────────────────────────
          heading1('ÍNDICE DE CONTENIDO'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(8), after: 0 }, children: [new TextRun('')] }),
          new TableOfContents('Índice de Contenido', {
            hyperlink: true,
            headingStyleRange: '1-2',
          }),
          pageBreak(),

          // ── Dedicatoria (opcional) ──────────────────────────────
          ...(data.dedicatoria ? [
            heading1('DEDICATORIA'),
            new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
            bodyParagraph(data.dedicatoria, { alignment: AlignmentType.RIGHT }),
            pageBreak(),
          ] : []),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 3: INTRODUCCIÓN  (reinicia numeración arábiga en p. 1)
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: M_CHAP,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        footers: { default: pageFooter() },
        children: [
          heading1('INTRODUCCIÓN'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...textToParas(data.introduccion),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 4: CAPÍTULO I
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: M_CHAP,
          },
        },
        children: [
          heading1('CAPÍTULO I'),
          heading1('INFORMACIÓN DE LA EMPRESA'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),

          heading2('1.1 Ubicación Geográfica'),
          ...textToParas(data.capitulo1.ubicacionGeografica),

          heading2('1.2 Reseña Histórica'),
          ...textToParas(data.capitulo1.resenaHistorica),

          heading2('1.3 Misión'),
          ...textToParas(data.capitulo1.mision),

          heading2('1.4 Visión'),
          ...textToParas(data.capitulo1.vision),

          heading2('1.5 Valores'),
          ...textToParas(data.capitulo1.valores),

          heading2('1.6 Objetivos de la Institución'),
          heading2('1.6.1 Objetivo General'),
          ...textToParas(data.capitulo1.objetivosInstitucion.general),

          heading2('1.6.2 Objetivos Específicos'),
          ...data.capitulo1.objetivosInstitucion.especificos.map(obj =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: LINE_15, before: 0, after: 0 },
              indent: { left: INDENT_1L },
              bullet: { level: 0 },
              children: [new TextRun({ text: obj, font: FONT, size: FONT_SIZE, color: BLACK })],
            })
          ),

          heading2('1.7 Estructura Organizativa'),
          ...textToParas(data.capitulo1.estructuraOrganizativa),

          heading2('1.8 Descripción del Departamento'),
          ...textToParas(data.capitulo1.descripcionDepartamento),

          heading2('1.9 Nombre del Jefe o Encargado'),
          bodyParagraph(data.capitulo1.nombreJefe),

          heading2('1.10 Funciones del Departamento'),
          ...textToParas(data.capitulo1.funcionesDepartamento),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 5: CAPÍTULO II
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: M_CHAP,
          },
        },
        children: [
          heading1('CAPÍTULO II'),
          heading1('DESCRIPCIÓN DEL PROYECTO'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),

          heading2('2.1 Título del Proyecto'),
          bodyParagraph(data.capitulo2.tituloProyecto),

          heading2('2.2 Planteamiento del Problema'),
          ...textToParas(data.capitulo2.planteamientoProblema),

          heading2('2.3 Objetivos'),
          heading2('2.3.1 Objetivo General'),
          ...textToParas(data.capitulo2.objetivos.general),

          heading2('2.3.2 Objetivos Específicos'),
          ...data.capitulo2.objetivos.especificos.map(obj =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: LINE_15, before: 0, after: 0 },
              indent: { left: INDENT_1L },
              bullet: { level: 0 },
              children: [new TextRun({ text: obj, font: FONT, size: FONT_SIZE, color: BLACK })],
            })
          ),

          heading2('2.4 Justificación'),
          ...textToParas(data.capitulo2.justificacion),

          heading2('2.5 Alcance'),
          ...textToParas(data.capitulo2.alcance),

          heading2('2.6 Limitaciones'),
          ...textToParas(data.capitulo2.limitaciones),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 6: CAPÍTULO III — GANTT (Horizontal)
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11),
              height: convertInchesToTwip(8.5),
            },
            margin: {
              top: convertMillimetersToTwip(50),
              bottom: convertMillimetersToTwip(30),
              right: convertMillimetersToTwip(30),
              left: convertMillimetersToTwip(40),
            },
          },
        },
        children: [
          heading1('CAPÍTULO III'),
          heading1('PLAN DE ACTIVIDADES'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),

          heading2('3.1 Diagrama de Gantt'),
          ...textToParas(data.capitulo3.diagramaGanttText),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_15, before: convertMillimetersToTwip(20), after: convertMillimetersToTwip(20) },
            children: [new TextRun({ text: '[Diagrama de Gantt — insertar imagen aquí]', font: FONT, size: FONT_SIZE, color: BLACK, italics: true })],
          }),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 7: CAPÍTULO III — Actividades (Vertical)
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.PORTRAIT, width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: M_STD,
          },
        },
        children: [
          heading2('3.2 Descripción de las Actividades por Semana'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(8), after: 0 }, children: [new TextRun('')] }),
          ...data.capitulo3.descripcionActividadesSemanas.flatMap(a => [
            heading2(a.semana),
            ...textToParas(a.descripcion),
          ]),

          heading2('3.3 Logros de las Actividades'),
          ...textToParas(data.capitulo3.logrosActividades),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 8: CAPÍTULO IV
      // ══════════════════════════════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: M_CHAP,
          },
        },
        children: [
          heading1('CAPÍTULO IV'),
          heading1('CONOCIMIENTOS ADQUIRIDOS'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...textToParas(data.capitulo4.conocimientosAdquiridos),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 9: CONCLUSIONES
      // ══════════════════════════════════════════════════════════════
      {
        properties: { page: { margin: M_CHAP } },
        children: [
          heading1('CONCLUSIONES'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...textToParas(data.conclusiones),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 10: RECOMENDACIONES
      // ══════════════════════════════════════════════════════════════
      {
        properties: { page: { margin: M_CHAP } },
        children: [
          heading1('RECOMENDACIONES'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),

          heading2('A la Universidad'),
          ...textToParas(data.recomendaciones.universidad),

          heading2('A la Institución'),
          ...textToParas(data.recomendaciones.institucion),

          heading2('A los Nuevos Pasantes'),
          ...textToParas(data.recomendaciones.nuevosPasantes),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 11: GLOSARIO
      // ══════════════════════════════════════════════════════════════
      {
        properties: { page: { margin: M_CHAP } },
        children: [
          heading1('GLOSARIO'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...data.glosario.map(t =>
            bodyMultiRun([
              new TextRun({ text: `${t.termino}: `, font: FONT, size: FONT_SIZE, bold: true, color: BLACK }),
              new TextRun({ text: t.definicion, font: FONT, size: FONT_SIZE, color: BLACK }),
            ])
          ),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 12: BIBLIOGRAFÍA (APA 6 — Sangría francesa)
      // ══════════════════════════════════════════════════════════════
      {
        properties: { page: { margin: M_CHAP } },
        children: [
          heading1('BIBLIOGRAFÍA'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...data.bibliografia.map(ref =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: LINE_15, before: 0, after: convertMillimetersToTwip(6) },
              indent: { left: INDENT_1L, hanging: INDENT_1L }, // Sangría francesa APA
              children: [new TextRun({ text: ref, font: FONT, size: FONT_SIZE, color: BLACK })],
            })
          ),
        ],
      },

      // ══════════════════════════════════════════════════════════════
      // SECCIÓN 13: ANEXOS
      // ══════════════════════════════════════════════════════════════
      {
        properties: { page: { margin: M_CHAP } },
        children: [
          heading1('ANEXOS'),
          new Paragraph({ spacing: { line: LINE_15, before: convertMillimetersToTwip(12), after: 0 }, children: [new TextRun('')] }),
          ...textToParas(data.anexosText),
        ],
      },

    ],
  });

  return doc;
}
