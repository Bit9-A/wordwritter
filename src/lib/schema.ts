import { z } from 'zod';

// ============================================================
// Esquemas Modulares para Generación Aislada
// ============================================================

export const preliminaresSchema = z.object({
  portada: z.object({
    nombres: z.string().describe("Nombres del estudiante en MAYÚSCULAS"),
    apellidos: z.string().describe("Apellidos del estudiante en MAYÚSCULAS"),
    cedula: z.string().describe("Cédula de identidad del estudiante"),
    tituloProyecto: z.string().describe("Título del proyecto en MAYÚSCULAS"),
    ciudad: z.string().describe("Ciudad donde se realizaron las pasantías"),
    fechaMes: z.string().describe("Mes de presentación (ej. MAYO)"),
    fechaAno: z.string().describe("Año de presentación (ej. 2025)"),
  }),
  actasEvaluacion: z.object({
    actaInstitucional: z.string(),
    actaAcademica: z.string(),
    actaEvaluador: z.string(),
  }),
  dedicatoria: z.string().optional(),
  introduccion: z.string().describe("Introducción del informe (mínimo 300 palabras)"),
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
    diagramaGanttText: z.string(),
    diagramaGanttData: z.array(z.object({
      objetivo: z.string(),
      actividades: z.array(z.object({
        descripcion: z.string(),
        tareas: z.array(z.object({
          descripcion: z.string(),
          semanas: z.array(z.number()),
        })),
      })),
    })),
    descripcionActividadesSemanas: z.array(z.object({
      semana: z.string(),
      descripcion: z.string(),
    })),
    logrosActividades: z.string(),
  }),
});

export const capitulo4Schema = z.object({
  capitulo4: z.object({
    conocimientosAdquiridos: z.string(),
  }),
  conclusiones: z.string(),
  recomendaciones: z.object({
    universidad: z.string(),
    institucion: z.string(),
    nuevosPasantes: z.string(),
  }),
});

export const extrasSchema = z.object({
  glosario: z.array(z.object({
    termino: z.string(),
    definicion: z.string(),
  })),
  bibliografia: z.array(z.string()),
  anexosText: z.string(),
});

// Esquema Monolítico (Retrocompatibilidad)
export const documentSchema = z.object({
  ...preliminaresSchema.shape,
  ...capitulo1Schema.shape,
  ...capitulo2Schema.shape,
  ...capitulo3Schema.shape,
  ...capitulo4Schema.shape,
  ...extrasSchema.shape,
});

export type DocumentData = z.infer<typeof documentSchema>;
