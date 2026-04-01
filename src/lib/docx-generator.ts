import { Document, Packer, Paragraph, TextRun, HeadingLevel, convertInchesToTwip, convertMillimetersToTwip, AlignmentType, PageOrientation, PageNumber, NumberFormat } from 'docx';
import { DocumentData } from './schema';

const CM_TO_TWIP = 567.0; // 1 cm = 567 twips

export async function generateDocument(data: DocumentData): Promise<Buffer> {
  const defaultFont = "Times New Roman";
  const defaultSize = 24; // 12pt (half-points in docx)

  const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: defaultFont,
                    size: defaultSize,
                    color: "000000",
                },
                paragraph: {
                    spacing: {
                        line: 360, // 1.5 line spacing (240 twips = single, 360 = 1.5)
                        before: 0,
                        after: 0,
                    },
                },
            },
        },
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            run: {
               font: defaultFont,
               size: defaultSize,
               color: "000000",
            },
            paragraph: {
                spacing: { line: 360, before: 0, after: 0 },
            }
          },
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
               font: defaultFont,
               size: defaultSize,
               color: "000000",
               bold: true,
            },
            paragraph: {
                spacing: { line: 360, before: 0, after: 0 },
                alignment: AlignmentType.CENTER,
            }
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: {
               font: defaultFont,
               size: defaultSize,
               color: "000000",
               bold: true,
            },
            paragraph: {
                spacing: { line: 360, before: 0, after: 0 },
                alignment: AlignmentType.LEFT,
            }
          }
        ]
    },
    sections: [
        // PRELIMINARES
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 3 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                    pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
                },
            },
            children: [
                new Paragraph({ text: "REPÚBLICA BOLIVARIANA DE VENEZUELA", alignment: AlignmentType.CENTER, style: "Normal" }),
                new Paragraph({ text: "MINISTERIO DEL PODER POPULAR PARA LA DEFENSA", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA DE LA FUERZA ARMADA NACIONAL", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "UNEFA NÚCLEO TÁCHIRA", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: " " }),
                new Paragraph({ text: " " }),
                new Paragraph({ text: " " }),
                new Paragraph({ text: data.portada.tituloProyecto, alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: " " }),
                new Paragraph({ text: " " }),
                new Paragraph({ text: `Autor: ${data.portada.nombres} ${data.portada.apellidos}`, alignment: AlignmentType.RIGHT }),
                new Paragraph({ text: `Cédula: ${data.portada.cedula}`, alignment: AlignmentType.RIGHT }),
                new Paragraph({ text: " " }),
                new Paragraph({ text: `San Cristóbal, ${data.portada.fechaMes} ${data.portada.fechaAno}`, alignment: AlignmentType.CENTER }),
            ]
        },
        // TODO: Agregar Índices y Preliminares

        // CAPÍTULOS (Inicio Cap 1: Margen Superior a 5cm)
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                    pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
                },
            },
            children: [
                new Paragraph({ text: "CAPÍTULO I", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "INFORMACIÓN DE LA EMPRESA", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "1.1 Ubicación Geográfica", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo1.ubicacionGeografica }),
                new Paragraph({ text: "1.2 Reseña Histórica de la Institución", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo1.resenaHistorica }),
                new Paragraph({ text: "1.3 Misión", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo1.mision }),
                new Paragraph({ text: "1.4 Visión", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo1.vision }),
                new Paragraph({ text: "1.5 Valores", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo1.valores }),
                new Paragraph({ text: "1.6 Objetivos de la Institución", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "1.6.1 Objetivo General", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo1.objetivosInstitucion.general }),
                new Paragraph({ text: "1.6.2 Objetivos Específicos", heading: HeadingLevel.HEADING_2 }),
                ...data.capitulo1.objetivosInstitucion.especificos.map(obj => new Paragraph({ text: `- ${obj}` })),
                // ... (agregar resto de campos de cap 1)
            ]
        },

        // CAPÍTULO II
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "CAPÍTULO II", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "RESUMEN", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "2.1 Título del Proyecto", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo2.tituloProyecto }),
                // ...otros 
            ]
        },

        // CAPÍTULO III (Incluye Gantt en Horizontal)
        {
            properties: {
                page: {
                    size: { orientation: PageOrientation.LANDSCAPE, width: convertInchesToTwip(11), height: convertInchesToTwip(8.5) },
                    margin: { top: 3 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "CAPÍTULO III", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "PLAN DE ACTIVIDADES", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "3.1 Diagrama de Gantt", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo3.diagramaGanttText }), // Representación textual básica
            ]
        },

        // CAPÍTULO III (Continuación, vuelve a Vertical)
        {
            properties: {
                page: {
                    size: { orientation: PageOrientation.PORTRAIT, width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 3 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "3.2 Descripción de las Actividades", heading: HeadingLevel.HEADING_2 }),
                ...data.capitulo3.descripcionActividadesSemanas.map(a => [
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: a.semana, heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: a.descripcion }),
                ]).flat(),
                new Paragraph({ text: "3.3 Logros de las Actividades", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.capitulo3.logrosActividades }),
            ]
        },

        // CAPÍTULO IV (Inicio Cap 4: Margen Superior a 5cm)
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "CAPÍTULO IV", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "CONOCIMIENTOS ADQUIRIDOS", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: data.capitulo4.conocimientosAdquiridos }),
            ]
        },

        // CONCLUSIONES
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "CONCLUSIONES", heading: HeadingLevel.HEADING_1 }),
                ...data.conclusiones.split('\n').map(line => new Paragraph({ text: line })),
            ]
        },

        // RECOMENDACIONES
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "RECOMENDACIONES", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "A la Universidad", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.recomendaciones.universidad }),
                new Paragraph({ text: "A la Institución", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.recomendaciones.institucion }),
                new Paragraph({ text: "A los Nuevos Pasantes", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.recomendaciones.nuevosPasantes }),
            ]
        },

        // GLOSARIO
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "GLOSARIO", heading: HeadingLevel.HEADING_1 }),
                ...data.glosario.map(t => new Paragraph({ text: `${t.termino}: ${t.definicion}` })),
            ]
        },

        // BIBLIOGRAFÍA
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "BIBLIOGRAFÍA", heading: HeadingLevel.HEADING_1 }),
                ...data.bibliografia.map(b => new Paragraph({ text: b })), // TODO: Sangría francesa o de 1.5 cm según APA
            ]
        },
        // ANEXOS
        {
            properties: {
                page: {
                    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
                    margin: { top: 5 * CM_TO_TWIP, bottom: 3 * CM_TO_TWIP, right: 3 * CM_TO_TWIP, left: 4 * CM_TO_TWIP },
                },
            },
            children: [
                new Paragraph({ text: "ANEXOS", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: data.anexosText }), 
            ]
        }
    ],
  });

  return await Packer.toBuffer(doc);
}
