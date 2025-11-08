/**
 * Script para actualizar el rol del usuario admin a superAdmin
 */

require("dotenv").config();
const { dbConnection } = require("../config");
const User = require("../../features/user/user.models");

const updateAdminRole = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    const admin = await User.findOne({ correo: "admin@taller.com" });

    if (!admin) {
      console.log("❌ Usuario admin@taller.com no encontrado");
      process.exit(1);
    }

    console.log(`Usuario encontrado: ${admin.nombre}`);
    console.log(`Rol actual: ${admin.rol}`);

    admin.rol = "superAdmin";
    await admin.save();

    console.log(`\n✅ Rol actualizado a: superAdmin`);
    console.log("🎉 Usuario admin ahora tiene permisos completos\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

updateAdminRole();
