# Guía para Publicar Haka Insight en VS Code Marketplace

## Requisitos Previos

1. **Cuenta de Azure DevOps**: Necesitas una cuenta de Microsoft/Azure
2. **Personal Access Token (PAT)**: Token de acceso para publicar
3. **Publisher ID**: Identificador único para tu organización

## Paso 1: Crear una Cuenta de Publisher

1. Ve a [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Inicia sesión con tu cuenta de Microsoft
3. Crea un nuevo publisher:
   - **Publisher ID**: `hakalab` (ya lo tienes en package.json)
   - **Display Name**: Haka Lab
   - **Description**: Descripción de tu organización

## Paso 2: Generar Personal Access Token (PAT)

1. Ve a [Azure DevOps](https://dev.azure.com/)
2. Click en tu perfil → **Personal Access Tokens**
3. Click **New Token**
4. Configura:
   - **Name**: VS Code Publishing
   - **Organization**: All accessible organizations
   - **Expiration**: 90 días (o custom)
   - **Scopes**: Selecciona **Marketplace** → **Manage**
5. Copia el token (¡guárdalo en un lugar seguro!)

## Paso 3: Instalar vsce (VS Code Extension Manager)

```bash
npm install -g @vscode/vsce
```

## Paso 4: Actualizar package.json

Agrega los siguientes campos a tu `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/hakalab/haka-insight.git"
  },
  "bugs": {
    "url": "https://github.com/hakalab/haka-insight/issues"
  },
  "homepage": "https://github.com/hakalab/haka-insight#readme",
  "license": "MIT",
  "icon": "media/icon.png",
  "galleryBanner": {
    "color": "#0a0e27",
    "theme": "dark"
  },
  "keywords": [
    "code analysis",
    "architecture",
    "security",
    "quality",
    "ai",
    "gemini",
    "diagram",
    "visualization"
  ],
  "categories": [
    "Programming Languages",
    "Linters",
    "Visualization",
    "Other"
  ]
}
```

## Paso 5: Preparar Archivos Necesarios

### 5.1 Crear un ícono (128x128 px)
- Convierte `media/icon.svg` a PNG de 128x128 píxeles
- Guárdalo como `media/icon.png`

### 5.2 Actualizar README.md
Asegúrate de que tu README incluya:
- Descripción clara de la extensión
- Screenshots o GIFs de demostración
- Instrucciones de instalación
- Requisitos (API Key de Gemini)
- Características principales
- Cómo usar la extensión

### 5.3 Crear CHANGELOG.md
```markdown
# Change Log

## [0.0.1] - 2026-02-06

### Added
- Initial release
- AI-powered code architecture analysis
- Interactive diagram visualization
- Security vulnerability detection
- Code quality analysis
- Gemini AI integration
```

### 5.4 Crear LICENSE
Si no tienes uno, crea un archivo LICENSE (MIT es común):
```
MIT License

Copyright (c) 2026 Haka Lab

Permission is hereby granted, free of charge, to any person obtaining a copy...
```

## Paso 6: Empaquetar la Extensión

```bash
# Compilar en modo producción
npm run package

# Crear el paquete .vsix
vsce package
```

Esto creará un archivo `code-architect-hakalab-0.0.1.vsix`

## Paso 7: Publicar en el Marketplace

### Opción A: Publicar con vsce (Recomendado)

```bash
# Login con tu PAT
vsce login hakalab

# Publicar
vsce publish
```

### Opción B: Publicar Manualmente

1. Ve a [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage/publishers/hakalab)
2. Click en tu publisher
3. Click **New Extension** → **Visual Studio Code**
4. Sube el archivo `.vsix`
5. Completa la información adicional

## Paso 8: Actualizar Versiones

Para publicar actualizaciones:

```bash
# Incrementar versión patch (0.0.1 → 0.0.2)
vsce publish patch

# Incrementar versión minor (0.0.1 → 0.1.0)
vsce publish minor

# Incrementar versión major (0.0.1 → 1.0.0)
vsce publish major

# O especificar versión
vsce publish 1.0.0
```

## Checklist Pre-Publicación

- [ ] Todos los tests pasan
- [ ] La extensión funciona correctamente en modo producción
- [ ] README.md está completo con screenshots
- [ ] CHANGELOG.md está actualizado
- [ ] LICENSE está incluido
- [ ] Ícono está en formato PNG 128x128
- [ ] package.json tiene todos los campos requeridos
- [ ] No hay información sensible (API keys, tokens) en el código
- [ ] .vscodeignore está configurado correctamente

## Comandos Útiles

```bash
# Verificar el paquete antes de publicar
vsce ls

# Ver qué archivos se incluirán
vsce package --out test.vsix

# Despublicar una versión (¡cuidado!)
vsce unpublish hakalab.code-architect-hakalab@0.0.1
```

## Notas Importantes

1. **Primera publicación**: Puede tardar unos minutos en aparecer en el marketplace
2. **Validación**: Microsoft revisa las extensiones, puede tomar 24-48 horas
3. **Versiones**: Una vez publicada una versión, no se puede modificar, solo despublicar
4. **Estadísticas**: Puedes ver descargas e instalaciones en el portal de publisher

## Recursos

- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
