/**
 * Seeder de Usuarios con Roles
 * Crea usuarios de prueba para diferentes roles del sistema
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { dbConnection } = require("../config");
const User = require("../../features/user/user.models");

const seedUsers = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🌱 SEEDER: USUARIOS Y ROLES");
    console.log("=".repeat(60));

    // ============================================
    // CREAR USUARIOS CON DIFERENTES ROLES
    // ============================================
    console.log("\n👥 Creando usuarios de prueba...");
    console.log("-".repeat(60));

    const usuariosData = [
      {
        nombre: "Super Admin",
        correo: "superadmin@taller.com",
        password: "SuperAdmin123!",
        rol: "superAdmin",
        departamento: ["administracion", "inventario"],
        acceso: "completo",
        telefono: "04241111111",
      },
      {
        nombre: "Admin Sistema",
        correo: "admin@taller.com",
        password: "Admin123!",
        rol: "superAdmin",
        departamento: ["administracion", "inventario"],
        acceso: "completo",
        telefono: "04241234567",
      },
      {
        nombre: "Carlos Méndez",
        correo: "asesor@taller.com",
        password: "Asesor123!",
        rol: "admin",
        departamento: ["taller", "servicio"],
        acceso: "completo",
        telefono: "04242345678",
      },
      {
        nombre: "María Rodríguez",
        correo: "almacenista@taller.com",
        password: "Almacen123!",
        rol: "operador",
        departamento: ["inventario"],
        acceso: "limitado",
        telefono: "04243456789",
      },
      {
        nombre: "Pedro Jiménez",
        correo: "tecnico@taller.com",
        password: "Tecnico123!",
        rol: "operador",
        departamento: ["taller"],
        acceso: "limitado",
        telefono: "04244567890",
      },
      {
        nombre: "Ana López",
        correo: "asesor2@taller.com",
        password: "Asesor123!",
        rol: "admin",
        departamento: ["servicio"],
        acceso: "completo",
        telefono: "04245678901",
      },
      {
        nombre: "Luis Torres",
        correo: "tecnico2@taller.com",
        password: "Tecnico123!",
        rol: "operador",
        departamento: ["taller"],
        acceso: "limitado",
        telefono: "04246789012",
      },
    ];

    const usuariosCreados = [];

    for (const userData of usuariosData) {
      // Verificar si ya existe
      let usuario = await User.findOne({ correo: userData.correo });

      if (!usuario) {
        // Hash de la contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(userData.password, salt);

        // Crear usuario
        usuario = await User.create({
          ...userData,
          password: hashedPassword,
        });

        console.log(`✅ ${usuario.nombre} (${usuario.rol})`);
        console.log(`   📧 ${usuario.correo} | 🔑 ${userData.password}`);
        usuariosCreados.push(usuario);
      } else {
        console.log(`ℹ️  ${userData.nombre} ya existe`);
        usuariosCreados.push(usuario);
      }
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL SEEDER");
    console.log("=".repeat(60));

    const totalUsuarios = await User.countDocuments();
    const superAdminCount = await User.countDocuments({ rol: "superAdmin" });
    const adminCount = await User.countDocuments({ rol: "admin" });
    const operadorCount = await User.countDocuments({ rol: "operador" });
    const userCount = await User.countDocuments({ rol: "user" });

    console.log(`
    ✅ Total Usuarios: ${totalUsuarios}
    
    Por rol:
    - 👑 Super Admin: ${superAdminCount}
    - 👨‍� Administradores: ${adminCount}
    - � Operadores: ${operadorCount}
    - � Usuarios: ${userCount}
    `);

    console.log("\n📝 CREDENCIALES DE ACCESO:");
    console.log("-".repeat(60));
    console.log("Admin:        admin@taller.com / Admin123!");
    console.log("Asesor:       asesor@taller.com / Asesor123!");
    console.log("Almacenista:  almacenista@taller.com / Almacen123!");
    console.log("Técnico:      tecnico@taller.com / Tecnico123!");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEEDER COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error en el seeder:", error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
