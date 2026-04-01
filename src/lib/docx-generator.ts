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
  PageBreak
} from 'docx';
import { DocumentData } from './schema';

const CM_TO_TWIP = 567.0; // 1 cm = 567 twips

export async function generateDocument(data: DocumentData): Promise<Buffer> {
  const defaultFont = "Arial";
  const defaultSize = 24; // 12pt (half-points in docx)
  const blackColor = "000000";

  const standardMargins = { 
    top: 3 * CM_TO_TWIP, 
    bottom: 3 * CM_TO_TWIP, 
    right: 3 * CM_TO_TWIP, 
    left: 4 * CM_TO_TWIP 
  };

  const chapterStartMargins = { 
    top: 5 * CM_TO_TWIP, 
    bottom: 3 * CM_TO_TWIP, 
    right: 3 * CM_TO_TWIP, 
    left: 4 * CM_TO_TWIP 
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: defaultFont,
            size: defaultSize,
            color: blackColor,
          },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 360, // 1.5 line spacing
              before: 0,
              after: 0,
            },
            indent: { firstLine: 708 }, // Sangría de primera línea APA 6
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: defaultFont, size: defaultSize, color: blackColor },
          paragraph: { 
            alignment: AlignmentType.JUSTIFIED, 
            spacing: { line: 360 },
            indent: { firstLine: 708 }, // Sangría de primera línea (aprox 1.25cm o 0.5 pulgadas)
          }
        },
        {
          id: "Heading1",
          name: "Heading 1",
          run: { font: defaultFont, size: defaultSize, color: blackColor, bold: true, allCaps: true },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { line: 360 } }
        },
        {
          id: "Heading2",
          name: "Heading 2",
          run: { font: defaultFont, size: defaultSize, color: blackColor, bold: true },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { line: 360 } }
        }
      ]
    },
    sections: [
      // 1. PORTADA (No se numera)
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: standardMargins,
          },
        },
        children: [
          new Paragraph({ children: [new TextRun({ text: "REPÚBLICA BOLIVARIANA DE VENEZUELA", bold: true })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun("MINISTERIO DEL PODER POPULAR PARA LA DEFENSA")], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun("UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA DE LA FUERZA ARMADA NACIONAL")], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun("UNEFA NÚCLEO TÁCHIRA")], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun(" ")], spacing: { before: 1200 } }),
          new Paragraph({ 
            children: [new TextRun({ text: data.portada.tituloProyecto.toUpperCase(), bold: true })],
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ children: [new TextRun(" ")], spacing: { before: 2400 } }),
          new Paragraph({ children: [new TextRun(`Autor: ${data.portada.nombres} ${data.portada.apellidos}`)], alignment: AlignmentType.RIGHT }),
          new Paragraph({ children: [new TextRun(`Cédula: ${data.portada.cedula}`)], alignment: AlignmentType.RIGHT }),
          new Paragraph({ children: [new TextRun(" ")], spacing: { before: 1200 } }),
          new Paragraph({ children: [new TextRun(`San Cristóbal, ${data.portada.fechaMes} ${data.portada.fechaAno}`)], alignment: AlignmentType.CENTER }),
        ]
      },

      // 2. PRELIMINARES (Actas, Dedicatoria, Índice) - Números romanos
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: standardMargins,
            pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Acta Institucional
          new Paragraph({ children: [new TextRun("ACTA DE EVALUACIÓN INSTITUCIONAL")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun(data.actasEvaluacion.actaInstitucional)] }),
          new Paragraph({ children: [new PageBreak()] }),

          // Acta Académica
          new Paragraph({ children: [new TextRun("ACTA DE EVALUACIÓN ACADÉMICA")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun(data.actasEvaluacion.actaAcademica)] }),
          new Paragraph({ children: [new PageBreak()] }),

          // Acta Evaluador
          new Paragraph({ children: [new TextRun("ACTA DE EVALUACIÓN DEL JURADO")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun(data.actasEvaluacion.actaEvaluador)] }),
          new Paragraph({ children: [new PageBreak()] }),

          // Índice
          new Paragraph({ children: [new TextRun("ÍNDICE")], heading: HeadingLevel.HEADING_1 }),
          new TableOfContents("Índice", {
            hyperlink: true,
            headingStyleRange: "1-2",
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // Dedicatoria
          ...(data.dedicatoria ? [
            new Paragraph({ children: [new TextRun("DEDICATORIA")], heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ children: [new TextRun(data.dedicatoria)], alignment: AlignmentType.RIGHT }),
            new Paragraph({ children: [new PageBreak()] }),
          ] : []),
        ]
      },

      // 3. INTRODUCCIÓN (Página 1, no se escribe el número)
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: chapterStartMargins,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
          type: "nextPage",
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({ children: [new TextRun("INTRODUCCIÓN")], heading: HeadingLevel.HEADING_1 }),
          ...data.introduccion.split('\n').map(p => new Paragraph({ children: [new TextRun(p)] })),
        ]
      },

      // 4. CAPÍTULO I (Comienza en página 2)
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: chapterStartMargins,
          },
        },
        children: [
          new Paragraph({ children: [new TextRun("CAPÍTULO I")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("INFORMACIÓN DE LA EMPRESA")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("1.1 Ubicación Geográfica")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.ubicacionGeografica)] }),
          new Paragraph({ children: [new TextRun("1.2 Reseña Histórica")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.resenaHistorica)] }),
          new Paragraph({ children: [new TextRun("1.3 Misión")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.mision)] }),
          new Paragraph({ children: [new TextRun("1.4 Visión")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.vision)] }),
          new Paragraph({ children: [new TextRun("1.5 Valores")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.valores)] }),
          new Paragraph({ children: [new TextRun("1.6 Objetivos de la Institución")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun("1.6.1 Objetivo General")], heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun(data.capitulo1.objetivosInstitucion.general)] }),
          new Paragraph({ children: [new TextRun("1.6.2 Objetivos Específicos")], heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          ...data.capitulo1.objetivosInstitucion.especificos.map(obj => new Paragraph({ children: [new TextRun(`- ${obj}`)] })),
          new Paragraph({ children: [new TextRun("1.7 Estructura Organizativa")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.estructuraOrganizativa)] }),
          new Paragraph({ children: [new TextRun("1.8 Descripción del Departamento")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.descripcionDepartamento)] }),
          new Paragraph({ children: [new TextRun("1.9 Nombre del Jefe o Encargado")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.nombreJefe)] }),
          new Paragraph({ children: [new TextRun("1.10 Funciones del Departamento")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo1.funcionesDepartamento)] }),
        ]
      },

      // 5. CAPÍTULO II
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: chapterStartMargins,
          },
        },
        children: [
          new Paragraph({ children: [new TextRun("CAPÍTULO II")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("RESUMEN")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("2.1 Título del Proyecto")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo2.tituloProyecto)] }),
          new Paragraph({ children: [new TextRun("2.2 Planteamiento del Problema")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo2.planteamientoProblema)] }),
          new Paragraph({ children: [new TextRun("2.3 Objetivos")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun("2.3.1 Objetivo General")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo2.objetivos.general)] }),
          new Paragraph({ children: [new TextRun("2.3.2 Objetivos Específicos")], heading: HeadingLevel.HEADING_2 }),
          ...data.capitulo2.objetivos.especificos.map(obj => new Paragraph({ children: [new TextRun(`- ${obj}`)] })),
          new Paragraph({ children: [new TextRun("2.4 Justificación")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo2.justificacion)] }),
          new Paragraph({ children: [new TextRun("2.5 Alcance")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo2.alcance)] }),
          new Paragraph({ children: [new TextRun("2.6 Limitaciones")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun(data.capitulo2.limitaciones)] }),
        ]
      },

      // 6. CAPÍTULO III (Gantt Horizontal)
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE, width: convertInchesToTwip(11), height: convertInchesToTwip(8.5) },
            margin: standardMargins,
          },
        },
        children: [
          new Paragraph({ children: [new TextRun("CAPÍTULO III")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("PLAN DE ACTIVIDADES")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("3.1 Diagrama de Gantt")], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [new TextRun("Indicar que el diagrama de Gantt debe ir en esta hoja en sentido horizontal.")], alignment: AlignmentType.CENTER, spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun(data.capitulo3.diagramaGanttText)] }),
        ]
      },

      // 7. CAPÍTULO III Cont. (Vertical)
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.PORTRAIT, width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: standardMargins,
          },
        },
        children: [
          new Paragraph({ children: [new TextRun("3.2 Descripción de las Actividades")], heading: HeadingLevel.HEADING_2 }),
          ...data.capitulo3.descripcionActividadesSemanas.flatMap(a => [
            new Paragraph({ children: [new TextRun(a.semana)], heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
            new Paragraph({ children: [new TextRun(a.descripcion)] }),
          ]),
          new Paragraph({ children: [new TextRun("3.3 Logros de las Actividades")], heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun(data.capitulo3.logrosActividades)] }),
        ]
      },

      // 8. CAPÍTULO IV
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: chapterStartMargins,
          },
        },
        children: [
          new Paragraph({ children: [new TextRun("CAPÍTULO IV")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("CONOCIMIENTOS ADQUIRIDOS")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun(data.capitulo4.conocimientosAdquiridos)] }),
        ]
      },

      // 9. CONCLUSIONES
      {
        properties: {
          page: { margin: chapterStartMargins },
        },
        children: [
          new Paragraph({ children: [new TextRun("CONCLUSIONES")], heading: HeadingLevel.HEADING_1 }),
          ...data.conclusiones.split('\n').map(p => new Paragraph({ children: [new TextRun(p)] })),
        ]
      },

      // 10. RECOMENDACIONES
      {
        properties: {
          page: { margin: chapterStartMargins },
        },
        children: [
          new Paragraph({ children: [new TextRun("RECOMENDACIONES")], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun("A la Universidad")], heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun(data.recomendaciones.universidad)] }),
          new Paragraph({ children: [new TextRun("A la Institución")], heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun(data.recomendaciones.institucion)] }),
          new Paragraph({ children: [new TextRun("A los Nuevos Pasantes")], heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun(data.recomendaciones.nuevosPasantes)] }),
        ]
      },

      // 11. GLOSARIO
      {
        properties: { page: { margin: chapterStartMargins } },
        children: [
          new Paragraph({ children: [new TextRun("GLOSARIO")], heading: HeadingLevel.HEADING_1 }),
          ...data.glosario.map(t => new Paragraph({
            children: [
              new TextRun({ text: `${t.termino}: `, bold: true }),
              new TextRun(t.definicion)
            ]
          }))
        ]
      },

      // 12. BIBLIOGRAFÍA
      {
        properties: { page: { margin: chapterStartMargins } },
        children: [
          new Paragraph({ children: [new TextRun("BIBLIOGRAFÍA")], heading: HeadingLevel.HEADING_1 }),
          ...data.bibliografia.map(b => new Paragraph({
            children: [new TextRun(b)],
            indent: { left: 720, hanging: 720 }, // Sangría francesa
            spacing: { after: 360 } // Un espacio de 1.5 cm aprox entre citas
          }))
        ]
      },

      // 13. ANEXOS
      {
        properties: { page: { margin: chapterStartMargins } },
        children: [
          new Paragraph({ children: [new TextRun("ANEXOS")], heading: HeadingLevel.HEADING_1 }),
          ...data.anexosText.split('\n').map(p => new Paragraph({ children: [new TextRun(p)] })),
        ]
      }
    ],
  });

  return await Packer.toBuffer(doc);
}

