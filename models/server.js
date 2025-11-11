// Librerías externas
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require("firebase-admin");

// Configuración de base de datos
const { dbConnection } = require("../database/config");

// Modelos y sockets
const Sockets = require("./sockets");

// Middlewares
const errorHandler = require("../middlewares/error-handler");

// Inicializa Firebase Admin solo si no está inicializado
if (!admin.apps.length) {
  // const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;

    // Definición de rutas de la API
    this.paths = {
      // Features Core
      auth: "/api/auth",
      user: "/api/user",
      autoSys: "/api/autoSys",
      inventory: "/api/inventory",

      // CRM
      vehicles: "/api/vehicles",
      customers: "/api/customers",

      // Utilidades
      buscar: "/api/buscar",
      historial: "/api/historial",
      uploads: "/api/uploads",
      notification: "/api/notification",
    }; // Conectar a base de datos
    this.conectarDB();

    // Middlewares
    this.middlewares();

    // Crear servidor HTTP
    this.server = http.createServer(this.app);

    // Configuración de sockets
    this.io = socketio(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"], // Acepta WebSocket y polling
    });

    // Middleware para inyectar sockets en las solicitudes
    this.app.use((req, res, next) => {
      req.io = this.io;
      next();
    });

    // Rutas de la aplicación
    this.routes();
    this.app.use(errorHandler);
  }

  async conectarDB() {
    await dbConnection();
  }

  middlewares() {
    // CORS
    this.app.use(
      cors({
        origin: "*", // o el dominio de tu frontss
        exposedHeaders: ["X-New-Token"],
      })
    );

    // Lectura y parseo del body
    this.app.use(express.json());

    // Directorio Público
    this.app.use(express.static("public"));

    // Fileupload - Carga de archivos
    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
        createParentPath: true,
      })
    );
  }

  routes() {
    // ============================================
    // Rutas de Features Core
    // ============================================

    // Autenticación y usuarios
    this.app.use(this.paths.auth, require("../features/auth"));
    this.app.use(this.paths.user, require("../features/user"));

    // Sistema automático
    this.app.use(this.paths.autoSys, require("../features/autoSys"));

    // Inventario
    this.app.use(this.paths.inventory, require("../features/inventory"));

    // ============================================
    // Rutas de CRM
    // ============================================

    // Gestión de vehículos
    this.app.use(this.paths.vehicles, require("../features/crm/vehicles"));

    // Gestión de clientes
    this.app.use(this.paths.customers, require("../features/crm/customers"));

    // ============================================
    // Rutas del Módulo Workshop - Work Orders
    // ============================================

    // Módulo completo de órdenes de trabajo
    this.app.use("/api", require("../features/workshop/work-orders"));

    // ============================================
    // Rutas del Módulo Workshop - Billing
    // ============================================

    // Módulo completo de facturación
    this.app.use("/api", require("../features/workshop/billing"));

    // ============================================
    // Rutas del Módulo Workshop - Service Bay
    // ============================================

    // Gestión de bahías de servicio
    this.app.use(
      "/api/service-bays",
      require("../features/workshop/service-bay/routes").serviceBayRoutes
    );

    // Asignaciones de técnicos a bahías
    this.app.use(
      "/api/work-orders",
      require("../features/workshop/service-bay/routes").assignmentRoutes
    );

    // Reportes y dashboard
    this.app.use(
      "/api/dashboard",
      require("../features/workshop/service-bay/routes").reportsRoutes
    );
    this.app.use(
      "/api/reports",
      require("../features/workshop/service-bay/routes").reportsRoutes
    );

    // ============================================
    // Rutas de Utilidades Generales
    // ============================================

    // Búsqueda general
    this.app.use(this.paths.buscar, require("../routes/buscar"));

    // Historial
    this.app.use(this.paths.historial, require("../routes/historial"));

    // Carga de archivos
    this.app.use(this.paths.uploads, require("../routes/uploads"));

    // Notificaciones
    this.app.use(this.paths.notification, require("../routes/notification"));

    // ============================================
    // Rutas de Firebase Cloud Messaging (FCM)
    // ============================================

    // Enviar notificación push
    this.app.post("/api/send-notification", async (req, res) => {
      try {
        const { token, title, body } = req.body;
        const message = {
          token,
          notification: { title, body },
          webpush: {
            fcmOptions: {
              link: "https://tudominio.com",
            },
          },
        };
        await admin.messaging().send(message);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Guardar token de notificaciones
    this.app.use("/api/save-token", require("../routes/notificationToken"));
  }

  configurarSockets() {
    new Sockets(this.io);
  }

  listen() {
    // Inicializar sockets
    this.configurarSockets();
    this.server.listen(this.port, () => {
      console.log("Servidor corriendo en puerto", this.port);
    });
  }
}

module.exports = Server;
