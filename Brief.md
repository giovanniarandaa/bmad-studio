# BMAD Studio - Product Brief V1.0

## 1. Resumen Ejecutivo

### Qué es

BMAD Studio es una aplicación de escritorio para macOS que centraliza la gestión del sistema BMAD (comandos y skills de planificación), permite generar documentación de features usando múltiples LLMs en paralelo, visualizar y editar la documentación generada, y proporciona herramientas de code review con IA antes de hacer merge.

### Propuesta de valor

- **Desacoplar la planificación de Claude Code** — Usar cualquier LLM para discovery y documentación
- **Consenso multi-IA** — Generar Spec/Tech/Steps con 3+ LLMs y mergear lo mejor de cada uno
- **Feedback loop para BMAD** — Mejorar comandos y skills basándose en errores detectados
- **Code Review inteligente** — Detectar malas prácticas antes del merge
- **Experiencia visual** — Ver documentación renderizada, no archivos .md crudos

### Público objetivo

Desarrolladores que usan el sistema BMAD con Claude Code y quieren:

- Mejorar la calidad de su documentación de features
- Reducir errores en la implementación mediante mejor planificación
- Mantener y evolucionar sus comandos/skills de forma sistemática
- Aprovechar múltiples LLMs sin cambiar de contexto

---

## 2. Objetivos V1.0

### Core Features

- [ ] Gestión de proyectos (agregar carpetas de proyectos existentes)
- [ ] Visualización de documentación de features (Spec, Tech, Steps, Status)
- [ ] Chat de Discovery con LLM configurable para explorar ideas
- [ ] Generación multi-LLM de documentos (Spec, Tech, Steps)
- [ ] Vista comparativa lado a lado y por sección
- [ ] Editor de merge para combinar lo mejor de cada LLM
- [ ] BMAD Manager para editar comandos y skills globales
- [ ] Chat de mejora de BMAD con contexto de errores
- [ ] Terminal integrada para ejecutar tests
- [ ] Code Review con IA de cambios en rama

### Configuración

- [ ] Gestión de API keys (OpenAI, Google AI, DeepSeek, Anthropic)
- [ ] Selección de modelos por fase (Discovery, Spec, Tech, Steps, Review)
- [ ] Ruta global de BMAD (~/.claude/)

---

## 3. Entidades del Sistema

### Project

Representa un proyecto de desarrollo vinculado a BMAD Studio.

- name: Nombre del proyecto
- path: Ruta absoluta en el filesystem
- has_bmad: Si tiene estructura .dev/ inicializada
- created_at: Fecha de vinculación
- last_opened_at: Último acceso

**Relaciones:** Un Project tiene muchas Features.

### Feature

Una feature dentro de un proyecto con su documentación BMAD.

- feature_id: ID numérico (001, 002...)
- name: Nombre slug (reset-password)
- status: Estado actual (planning, in-progress, review, done)
- project_id: Proyecto al que pertenece
- spec_path, tech_path, steps_path, status_path: Rutas a documentos

**Relaciones:** Pertenece a un Project. Tiene muchos Documents y GenerationSessions.

### Document

Un documento de planificación (Spec, Tech, Steps, Status).

- type: spec | tech | steps | status | quick
- content: Contenido markdown
- feature_id: Feature asociada
- version: Número de versión
- created_at, updated_at

**Relaciones:** Pertenece a una Feature.

### GenerationSession

Sesión de generación multi-LLM para un documento.

- feature_id: Feature asociada
- document_type: Tipo de documento generado
- status: pending | generating | comparing | merged | cancelled
- created_at

**Relaciones:** Pertenece a una Feature. Tiene muchos GenerationResults.

### GenerationResult

Resultado de un LLM específico dentro de una sesión.

- session_id: Sesión de generación
- provider: openai | google | deepseek | anthropic
- model: Modelo usado (gpt-4o, gemini-pro, etc.)
- content: Contenido generado
- generation_time_ms: Tiempo de generación
- token_count: Tokens consumidos
- selected_sections: Secciones elegidas para merge (JSON)

**Relaciones:** Pertenece a una GenerationSession.

### BMADCommand

Un comando del sistema BMAD (plan-spec, plan-tech, etc.).

- name: Nombre del comando
- file_path: Ruta al archivo .md
- description: Descripción extraída del frontmatter
- argument_hint: Hint de argumento del frontmatter
- allowed_tools: Tools permitidos del frontmatter
- content: Contenido actual
- extracted_prompt_logic: Lógica extraída para usar en prompts multi-LLM (JSON)
- is_planning_command: Si es plan-spec, plan-tech, plan-steps, plan-quick
- last_modified: Última modificación
- last_extraction: Última extracción de prompt logic

**Relaciones:** Tiene muchos ImprovementSuggestions. Referencia helpers en \_shared/.

### PromptTemplate

Template de prompt para generación multi-LLM, derivado de comandos BMAD.

- document_type: spec | tech | steps | quick
- base_prompt: Prompt base extraído del comando BMAD
- custom_overrides: Overrides manuales del usuario (JSON)
- required_context: Lista de archivos de contexto requeridos
- required_sections: Secciones que debe tener el output
- critical_restrictions: Restricciones que no se pueden violar (ej: "NO código")
- source_command_id: BMADCommand del que se extrajo
- version: Versión del template
- last_updated: Última actualización

**Relaciones:** Derivado de un BMADCommand.

### BMADSkill

Una skill del sistema BMAD.

- name: Nombre de la skill
- file_path: Ruta al archivo
- description: Descripción
- content: Contenido actual
- last_modified: Última modificación

**Relaciones:** Tiene muchos ImprovementSuggestions.

### ImprovementSuggestion

Sugerencia de mejora para un comando o skill.

- target_type: command | skill
- target_id: ID del comando o skill
- error_context: Descripción del error que motivó la sugerencia
- suggestion: Cambio sugerido por la IA
- diff: Diff propuesto
- status: pending | approved | rejected
- created_at

**Relaciones:** Pertenece a un BMADCommand o BMADSkill.

### CodeReviewSession

Sesión de code review de una rama.

- feature_id: Feature asociada
- branch_name: Nombre de la rama
- base_branch: Rama base (main, develop)
- files_changed: Lista de archivos modificados (JSON)
- status: pending | reviewing | completed
- created_at

**Relaciones:** Pertenece a una Feature. Tiene muchos CodeReviewFindings.

### CodeReviewFinding

Hallazgo individual del code review.

- session_id: Sesión de review
- file_path: Archivo afectado
- line_start, line_end: Líneas afectadas
- severity: info | warning | error
- category: duplication | misplacement | reusability | style | other
- message: Descripción del hallazgo
- suggestion: Sugerencia de corrección
- existing_component: Componente existente que podría usarse (si aplica)

**Relaciones:** Pertenece a una CodeReviewSession.

### TroubleshootingSession

Sesión de consulta multi-LLM para resolver problemas que Claude Code no puede.

- feature_id: Feature relacionada (opcional)
- project_id: Proyecto relacionado
- problem_description: Descripción del problema
- error_logs: Logs o errores pegados por el usuario
- files_shared: Lista de archivos compartidos con los LLMs (JSON)
- context_files_used: Context.md, Standards.md, CLAUDE.md, etc. usados
- status: pending | consulting | resolved | unresolved
- resolution_notes: Notas de cómo se resolvió
- created_at, resolved_at

**Relaciones:** Pertenece a un Project. Opcionalmente a una Feature. Tiene muchos TroubleshootingResponses.

### TroubleshootingResponse

Respuesta de un LLM específico a un problema.

- session_id: Sesión de troubleshooting
- provider: openai | google | deepseek | anthropic
- model: Modelo usado
- response_content: Respuesta completa del LLM
- suggested_solution: Solución sugerida extraída
- code_snippets: Snippets de código sugeridos (JSON)
- was_helpful: Marcado por el usuario como útil/no útil
- used_in_solution: Si esta respuesta se usó para resolver el problema

**Relaciones:** Pertenece a una TroubleshootingSession.

### ContextDocument

Documento de contexto del proyecto (Context.md, Standards.md, CLAUDE.md, AGENTS.md).

- project_id: Proyecto al que pertenece
- type: context | standards | claude | agents | custom
- file_path: Ruta relativa al proyecto
- content: Contenido cacheado
- is_dirty: Si hay cambios sin guardar en app
- last_synced: Última sincronización con filesystem
- last_modified_external: Última modificación externa detectada

**Relaciones:** Pertenece a un Project.

### LLMProvider

Configuración de un proveedor de LLM.

- name: openai | google | deepseek | anthropic
- api_key: Key encriptada
- default_model: Modelo por defecto
- is_enabled: Si está activo
- usage_this_month: Tokens/requests usados

**Relaciones:** Ninguna directa.

### AppSettings

Configuración global de la aplicación.

- bmad_global_path: Ruta a ~/.claude/ (donde Claude Code lee)
- bmad_repo_path: Ruta al repo bmad-method (para sync con git)
- bmad_sync_enabled: Si está habilitada la sincronización dual
- theme: light | dark | system
- default_providers_spec: Providers para Spec (JSON array)
- default_providers_tech: Providers para Tech
- default_providers_steps: Providers para Steps
- review_provider: Provider para code review

---

## 4. Roles y Permisos

V1 es single-user, no requiere sistema de roles.

---

## 5. Flujos Principales

### 5.1 Agregar Proyecto

```
[Usuario selecciona carpeta]
       │
       ▼
[Detectar si tiene .dev/]
       │
       ├─ Sí ──▶ [Indexar features existentes] ──▶ [Proyecto listo]
       │
       └─ No ──▶ [Preguntar si inicializar BMAD]
                        │
                        ├─ Sí ──▶ [Crear estructura .dev/] ──▶ [Proyecto listo]
                        │
                        └─ No ──▶ [Agregar sin BMAD] ──▶ [Proyecto listo]
```

### 5.2 Crear Feature con Discovery

```
[Usuario inicia nueva feature]
       │
       ▼
[Chat Discovery con LLM elegido]
       │
       ▼
[Conversación iterativa]
       │
       ▼
[Usuario: "Listo, genera documentación"]
       │
       ▼
[Sistema extrae contexto del chat]
       │
       ▼
[Flujo de Generación Multi-LLM]
```

### 5.3 Generación Multi-LLM de Documento

```
[Iniciar generación de Spec/Tech/Steps]
       │
       ▼
[Cargar contexto: proyecto, feature, docs previos]
       │
       ▼
[Llamar N providers en paralelo]
       │
       ├─────────────┼─────────────┤
       ▼             ▼             ▼
   [OpenAI]     [Gemini]     [DeepSeek]
       │             │             │
       ▼             ▼             ▼
   [Result 1]   [Result 2]   [Result 3]
       │             │             │
       └─────────────┴─────────────┘
                     │
                     ▼
         [Vista Comparativa]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   [Lado a lado]          [Por sección]
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            [Editor de Merge]
                     │
                     ▼
         [Usuario selecciona/edita]
                     │
                     ▼
          [Guardar documento final]
                     │
                     ▼
      [Actualizar .dev/features/XXX/]
```

**Estados de GenerationSession:**

- `pending` → Esperando inicio
- `generating` → LLMs trabajando
- `comparing` → Usuario revisando opciones
- `merged` → Documento final guardado
- `cancelled` → Usuario canceló

### 5.4 Code Review de Rama

```
[Usuario selecciona feature en status "in-progress"]
       │
       ▼
[Detectar rama actual vs base]
       │
       ▼
[Obtener diff de archivos modificados]
       │
       ▼
[Cargar contexto: .dev/context/, Spec, Tech]
       │
       ▼
[Enviar a LLM de review con prompt especializado]
       │
       ▼
[Recibir findings estructurados]
       │
       ▼
[Mostrar lista de hallazgos]
       │
       ├─ Por archivo
       ├─ Por severidad
       └─ Por categoría
       │
       ▼
[Usuario puede: ignorar, crear issue, dar feedback a BMAD]
```

**Categorías de findings:**

- `duplication` — Código duplicado, existe algo similar
- `misplacement` — Código en lugar incorrecto (debería ser util/service)
- `reusability` — Existe componente/service que ya hace esto
- `style` — Violación de estándares del proyecto
- `other` — Otros hallazgos

### 5.5 Mejora de BMAD con Feedback

```
[Usuario reporta error]
       │
       ├─ Desde: test fallido
       ├─ Desde: /qa-manual encontró bug
       └─ Desde: code review finding
       │
       ▼
[Chat con contexto del error]
       │
       ▼
[IA analiza: ¿qué comando/skill causó esto?]
       │
       ▼
[IA sugiere cambios específicos al .md]
       │
       ▼
[Mostrar diff propuesto]
       │
       ▼
[Usuario: aprobar / rechazar / editar]
       │
       ▼
[Si aprueba: guardar en ~/.claude/]
       │
       ▼
[Si sync habilitado: guardar también en bmad-method repo]
       │
       ▼
[Registrar mejora en historial]
```

### 5.5.1 Configuración de Sincronización BMAD

```
[Usuario abre Settings > BMAD]
       │
       ▼
[Configurar rutas]
       │
       ├─ BMAD Global Path: ~/.claude/
       │   └─ (Donde Claude Code lee los comandos)
       │
       └─ BMAD Repo Path: ~/Projects/bmad-method/.claude/
           └─ (Donde está tu repo para git commits)
       │
       ▼
[Habilitar sincronización dual: ON/OFF]
       │
       ▼
[Si ON: cada cambio se guarda en ambos lugares]
```

### 5.5.2 Flujo de Edición con Sync Dual

```
[Usuario edita plan-spec.md en BMAD Studio]
       │
       ▼
[Guardar (Cmd+S)]
       │
       ├─────────────────────────────────────┐
       ▼                                     ▼
[Guardar en ~/.claude/]          [Guardar en bmad-method/]
       │                                     │
       ▼                                     ▼
[Claude Code usa                 [Listo para git commit]
 versión actualizada]
       │
       ▼
[Mostrar notificación]
"✓ Guardado en ~/.claude/ y bmad-method"
```

### 5.5.3 Resolución de Conflictos BMAD

```
[BMAD Studio detecta diferencia entre ubicaciones]
       │
       ▼
[Mostrar alerta: "Archivo difiere entre ~/.claude/ y repo"]
       │
       ▼
[Mostrar diff lado a lado]
       │
       ├─ ~/.claude/ (izquierda)
       └─ bmad-method (derecha)
       │
       ▼
[Opciones]
       │
       ├─ Usar ~/.claude/ → Sobrescribe repo
       ├─ Usar repo → Sobrescribe ~/.claude/
       └─ Merge manual → Abrir editor
```

### 5.6 Troubleshooting Multi-LLM (Cuando Claude Code se atora)

```
[Usuario: Claude Code no puede resolver X]
       │
       ▼
[Abrir sesión de Troubleshooting]
       │
       ▼
[Describir el problema]
       │
       ├─ Pegar error/log
       ├─ Seleccionar archivos relevantes del proyecto
       └─ Opcional: vincular a feature específica
       │
       ▼
[Sistema carga contexto automáticamente]
       │
       ├─ CLAUDE.md / AGENTS.md (si existen)
       ├─ Context.md (stack, arquitectura)
       ├─ Standards.md (convenciones)
       └─ Archivos seleccionados por usuario
       │
       ▼
[Consultar N providers en paralelo]
       │
       ├─────────────┼─────────────┤
       ▼             ▼             ▼
   [ChatGPT]    [Gemini]     [DeepSeek]
       │             │             │
       └─────────────┴─────────────┘
                     │
                     ▼
         [Vista de respuestas]
                     │
         ┌───────────┴───────────┐
         │                       │
    [Tabs por LLM]      [Vista unificada]
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
    [Usuario marca respuestas útiles]
                     │
                     ▼
    [Copiar solución para Claude Code]
                     │
                     ▼
    [Marcar como resuelto + notas]
```

**Contexto que se comparte con los LLMs:**

- Descripción del problema y error logs
- CLAUDE.md o AGENTS.md (instrucciones para agentes)
- Context.md (stack, arquitectura, componentes disponibles)
- Standards.md (convenciones del proyecto)
- Archivos específicos seleccionados por el usuario
- Spec.md/Tech.md de la feature (si está vinculada)

**Output esperado:**

- Explicación del problema
- Posibles causas
- Solución sugerida con código
- Pasos para implementar la solución

### 5.7 Gestión de Documentos de Contexto

```
[Usuario abre sección "Contexto" del proyecto]
       │
       ▼
[Lista de documentos de contexto]
       │
       ├─ Context.md ──────── Stack, arquitectura, inventario
       ├─ Standards.md ────── Convenciones, límites
       ├─ CLAUDE.md ───────── Instrucciones para Claude Code
       ├─ AGENTS.md ───────── Instrucciones para agentes IA
       └─ Custom... ───────── Otros archivos .md de contexto
       │
       ▼
[Acciones por documento]
       │
       ├─ Ver/Editar ──────── Editor markdown con preview
       ├─ Sincronizar ─────── Recargar desde filesystem
       ├─ Actualizar con IA ─ Sugerir actualizaciones basadas en código
       └─ Historial ───────── Ver versiones anteriores
       │
       ▼
[Si hay conflicto: cambio externo vs cambio en app]
       │
       ├─ Usar versión local
       ├─ Usar versión externa
       └─ Merge manual
```

**Actualización inteligente de Context.md:**

```
[Usuario ejecuta "Actualizar inventario"]
       │
       ▼
[Escanear proyecto según stack]
       │
       ├─ Componentes nuevos
       ├─ Services/Actions
       ├─ Hooks/Utils
       └─ APIs/Rutas
       │
       ▼
[Comparar con Context.md actual]
       │
       ▼
[Mostrar diff de cambios sugeridos]
       │
       ▼
[Usuario aprueba/rechaza/edita]
       │
       ▼
[Guardar Context.md actualizado]
```

```
[Usuario abre terminal para proyecto]
       │
       ▼
[Terminal en directorio del proyecto]
       │
       ▼
[Ejecutar comando (npm test, php artisan test, etc.)]
       │
       ▼
[Mostrar output en tiempo real]
       │
       ▼
[Al finalizar: parsear resultado]
       │
       ├─ Todo OK ──▶ [Mostrar resumen verde]
       │
       └─ Fallos ──▶ [Extraer errores]
                           │
                           ▼
                [Botón: "Reportar a BMAD"]
                           │
                           ▼
                [Flujo 5.5 con contexto pre-cargado]
```

---

## 6. Reglas de Negocio

### Generación de Documentos

- Una GenerationSession debe tener al menos 1 provider configurado
- Los resultados se guardan incluso si el usuario cancela (para referencia)
- El documento mergeado reemplaza la versión anterior (se guarda backup)
- Los prompts usados derivan de PromptTemplate, que a su vez deriva de comandos BMAD
- Restricciones críticas (ej: "NO código en Tech.md") se validan post-generación

### Prompt Templates

- Se extraen automáticamente de plan-spec.md, plan-tech.md, plan-steps.md, plan-quick.md
- El usuario puede agregar custom_overrides sin perder la lógica base
- Si el comando BMAD fuente cambia, se notifica para re-extracción
- Cada provider puede tener ajustes específicos (algunos LLMs necesitan prompts más explícitos)

### Code Review

- Solo disponible si el proyecto tiene git inicializado
- Requiere que exista una rama diferente a main/develop
- Los findings se generan una vez por sesión; re-ejecutar crea nueva sesión
- El prompt de review usa Context.md para conocer componentes existentes

### BMAD Manager

- Solo modifica archivos en la ruta configurada (default: ~/.claude/)
- Si bmad_repo_path está configurado, sincroniza cambios a ambas ubicaciones
- Crea backup antes de cualquier modificación
- Historial de cambios se mantiene en SQLite local
- Modificar un comando de planificación (plan-\*.md) dispara re-extracción de PromptTemplate
- Si hay conflicto entre ~/.claude/ y repo, notificar al usuario

### Sincronización BMAD Dual

- Cuando se edita un comando/skill en BMAD Studio:
  1. Guarda en ~/.claude/ (inmediato, para Claude Code)
  2. Si bmad_repo_path está configurado, guarda también ahí
- Si el archivo existe en repo pero no en ~/.claude/, opción de copiar
- Si el archivo difiere entre ambos, mostrar diff y resolver
- Botón "Sincronizar todo" para forzar sync completo
- Indicador visual de estado de sync por archivo:
  - ✓ Sincronizado
  - ↑ Solo en ~/.claude/ (pendiente de copiar a repo)
  - ↓ Solo en repo (pendiente de instalar)
  - ⚡ Diferente en ambos (conflicto)

### Providers

- API key requerida para habilitar un provider
- Si un provider falla durante generación, continuar con los demás
- Mostrar error específico del provider que falló
- Tracking de tokens por provider para estimar costos

### Troubleshooting

- Los archivos seleccionados se envían como contexto, no se modifican
- Límite de contexto total: ~100k tokens (varía por provider)
- Mostrar estimación de tokens antes de consultar
- Las respuestas se guardan para referencia futura
- Si el problema se resuelve, registrar qué LLM ayudó (para métricas)

### Documentos de Contexto

- Context.md y Standards.md viven en .dev/context/
- CLAUDE.md y AGENTS.md viven en la raíz del proyecto
- Si hay cambios externos mientras se edita en app, notificar conflicto
- La actualización inteligente de Context.md nunca borra secciones manuales
- Historial de versiones se guarda por 30 días

### Documentos

- Spec debe existir antes de generar Tech
- Tech debe existir antes de generar Steps
- Quick.md es alternativa para features simples (bypass de Spec→Tech→Steps)
- Multi-LLM aplica a todos los documentos: Spec, Tech, Steps y Quick

### Context.md

- Requerido para Code Review (sin él no se puede ejecutar)
- Si el proyecto no tiene .dev/context/Context.md, mostrar advertencia y guía para crearlo

---

## 7. Integraciones

### APIs de LLM

| Provider  | API                               | Modelos Sugeridos                          |
| --------- | --------------------------------- | ------------------------------------------ |
| OpenAI    | api.openai.com                    | gpt-4o, gpt-4o-mini                        |
| Google    | generativelanguage.googleapis.com | gemini-1.5-pro, gemini-1.5-flash           |
| DeepSeek  | api.deepseek.com                  | deepseek-chat, deepseek-coder              |
| Anthropic | api.anthropic.com                 | claude-sonnet-4-20250514, claude-3-5-haiku |

### Sistema de Archivos

- Lectura/escritura de proyectos locales
- Acceso a ~/.claude/ para BMAD global
- Watch de cambios en archivos de documentación

### Git

- Detección de rama actual
- Diff entre ramas
- Lista de archivos modificados

---

## 8. Roadmap Futuro

### V1.1 - Mejoras de UX

- Templates personalizados para Spec/Tech/Steps
- Snippets reutilizables entre features
- Historial de chats de Discovery

### V1.2 - Colaboración

- Export de documentación a PDF/HTML
- Compartir GenerationSession (link temporal)
- Sync con GitHub Issues

### V2.0 - Automatización

- Webhooks para CI/CD (ejecutar review automático)
- Integración directa con Claude Code (abrir terminal con comando pre-cargado)
- Métricas de calidad de features (tiempo, bugs encontrados, etc.)

### Ideas Postponadas

- Soporte Windows/Linux (evaluar demanda)
- Modo equipo con múltiples usuarios
- Marketplace de comandos/skills BMAD
- Fine-tuning de modelos con historial de mejoras
