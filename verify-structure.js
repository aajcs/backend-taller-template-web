#!/usr/bin/env node

/**
 * Script de Verificación Post-Migración
 * Verifica que la estructura de features esté correctamente configurada
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Verificando estructura de features...\n");

const checks = [
  // Estructura de carpetas
  { path: "features/auth", type: "dir", desc: "Carpeta auth" },
  { path: "features/user", type: "dir", desc: "Carpeta user" },
  { path: "features/autoSys", type: "dir", desc: "Carpeta autoSys" },
  { path: "features/inventory", type: "dir", desc: "Carpeta inventory" },
  { path: "features/finance", type: "dir", desc: "Carpeta finance" },
  { path: "core/middleware", type: "dir", desc: "Carpeta core/middleware" },

  // Archivos auth
  { path: "features/auth/index.js", type: "file", desc: "Auth index" },
  { path: "features/auth/auth.routes.js", type: "file", desc: "Auth routes" },
  {
    path: "features/auth/auth.controllers.js",
    type: "file",
    desc: "Auth controllers",
  },

  // Archivos user
  { path: "features/user/index.js", type: "file", desc: "User index" },
  { path: "features/user/user.routes.js", type: "file", desc: "User routes" },
  {
    path: "features/user/user.controllers.js",
    type: "file",
    desc: "User controllers",
  },

  // Core
  {
    path: "core/middleware/tenantResolver.js",
    type: "file",
    desc: "TenantResolver middleware",
  },
  { path: "core/middleware/index.js", type: "file", desc: "Middleware index" },

  // Documentación
  { path: "features/README.md", type: "file", desc: "Features README" },
  { path: "MIGRATION.md", type: "file", desc: "Migration guide" },
  {
    path: "features/EXAMPLE_MIGRATION.js",
    type: "file",
    desc: "Example migration",
  },
];

let passed = 0;
let failed = 0;

checks.forEach((check) => {
  const fullPath = path.join(__dirname, check.path);
  const exists = fs.existsSync(fullPath);

  if (check.type === "dir") {
    const isDir = exists && fs.statSync(fullPath).isDirectory();
    if (isDir) {
      console.log(`✅ ${check.desc}`);
      passed++;
    } else {
      console.log(`❌ ${check.desc} - No encontrado`);
      failed++;
    }
  } else {
    const isFile = exists && fs.statSync(fullPath).isFile();
    if (isFile) {
      console.log(`✅ ${check.desc}`);
      passed++;
    } else {
      console.log(`❌ ${check.desc} - No encontrado`);
      failed++;
    }
  }
});

console.log(`\n📊 Resultado: ${passed} checks pasados, ${failed} fallidos`);

if (failed === 0) {
  console.log("\n✨ ¡Estructura de features verificada exitosamente!");
  console.log("\n📝 Próximos pasos:");
  console.log("   1. Arrancar el servidor: npm start (o node app.js)");
  console.log("   2. Probar endpoints de auth: POST /api/auth/login");
  console.log("   3. Probar endpoints de user: GET /api/users");
  console.log("   4. Ver MIGRATION.md para migrar más módulos");
  process.exit(0);
} else {
  console.log("\n⚠️  Algunas verificaciones fallaron. Revisa la estructura.");
  process.exit(1);
}
