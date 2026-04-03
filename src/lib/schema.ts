import { z } from 'zod';

export const preliminaresSchema = z.object({
  portada: z.object({
    nombres: z.string().describe("Nombres del estudiante en MAYÚSCULAS"),
    apellidos: z.string().describe("Apellidos del estudiante en MAYÚSCULAS"),
    cedula: z.string().describe("Cédula de identidad del estudiante"),
    tituloProyecto: z.string().describe("Título del proyecto en MAYÚSCULAS"),
    ciudad: z.string().describe("Ciudad donde se realizaron las pasantías"),
    fechaMes: z.string().describe("Mes de presentación (ej. MAYO)"),
    fechaAno: z.string().describe("Año de presentación (ej. 2025)"),
  }).describe("Información para la portada y validaciones de la Capa 4"),

  actasEvaluacion: z.object({
    actaInstitucional: z.string().describe("Contenido del Acta de Evaluación del Tutor Institucional"),
    actaAcademica: z.string().describe("Contenido del Acta de Evaluación del Tutor Académico"),
    actaEvaluador: z.string().describe("Contenido del Acta del Evaluador Final"),
  }),

  dedicatoria: z.string().optional().describe("Texto de dedicatoria opcional"),
  
  introduccion: z.string().describe("Introducción del informe (mínimo 1 página proyectada)"),
});

export const capitulo1Schema = z.object({
  capitulo1: z.object({
    ubicacionGeografica: z.string(),
    resenaHistorica: z.string(),
    mision: z.string(),
    vision: z.string(),
    valores: z.string(),
    objetivosInstitucion: z.object({
      general: z.string(),
      especificos: z.array(z.string()),
    }),
    estructuraOrganizativa: z.string(),
    descripcionDepartamento: z.string(),
    nombreJefe: z.string(),
    funcionesDepartamento: z.string(),
  }),
});

export const capitulo2Schema = z.object({
  capitulo2: z.object({
    tituloProyecto: z.string(),
    planteamientoProblema: z.string(),
    objetivos: z.object({
      general: z.string(),
      especificos: z.array(z.string()),
    }),
    justificacion: z.string(),
    alcance: z.string(),
    limitaciones: z.string(),
  }),
});

export const capitulo3Schema = z.object({
  capitulo3: z.object({
    diagramaGanttText: z.string().describe("Descripción textual introductoria del diagrama."),
    diagramaGanttData: z.array(z.object({
      objetivo: z.string().describe("Objetivo específico planificado"),
      actividades: z.array(z.object({
        descripcion: z.string().describe("Actividad planificada (debe haber 3 por objetivo)"),
        tareas: z.array(z.object({
          descripcion: z.string().describe("Tarea específica (debe haber 3 por actividad)"),
          semanas: z.array(z.number()).describe("Lista de números de semana (1 a 14) donde se realiza la tarea"),
        })).describe("Desglose de tareas para esta actividad"),
      })),
    })).describe("Estructura jerárquica de 3 niveles para el diagrama de Gantt"),
    descripcionActividadesSemanas: z.array(z.object({
      semana: z.string().describe("Ejemplo: 'Semana 1: Del 01 al 05 de Mayo'"),
      descripcion: z.string().describe("Asegurar de mencionar evidencias (Ej: Ver Anexo 1)"),
    })),
    logrosActividades: z.string(),
  }),
});

export const capitulo4Schema = z.object({
  capitulo4: z.object({
    conocimientosAdquiridos: z.string(),
  }),
});

export const conclusionesSchema = z.object({
  conclusiones: z.string(),
  
  recomendaciones: z.object({
    universidad: z.string(),
    institucion: z.string(),
    nuevosPasantes: z.string(),
  }),

  glosario: z.array(z.object({
    termino: z.string(),
    definicion: z.string(),
  })).describe("Debe estar ordenado alfabéticamente"),

  bibliografia: z.array(z.string()).describe("Lista de referencias en formato APA"),

  anexosText: z.string().describe("Texto introductorio para la sección de anexos o listado de anexos referenciados en el capítulo 3."),
});

// Reensamblado del esquema completo usando lodash/merge equivalent en zod: merge
export const documentSchema = preliminaresSchema
  .merge(capitulo1Schema)
  .merge(capitulo2Schema)
  .merge(capitulo3Schema)
  .merge(capitulo4Schema)
  .merge(conclusionesSchema);

export type DocumentData = z.infer<typeof documentSchema>;
