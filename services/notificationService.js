// notificationService.js
const admin = require("firebase-admin");
const usuario = require("../features/user/user.models");
const { notification } = require("../models");
const { sendEmail } = require("../utils/resend");
const templateMails = require("../utils/plantillasMail/templateMails");
// const pLimit = require("p-limit");

class NotificationService {
  constructor(io) {
    this.io = io;
  }
  /**
   * Orquesta y despacha notificaciones a través de múltiples canales.
   * Se ejecuta en segundo plano para no bloquear la respuesta al cliente.
   * @param {Object} config - Configuración de la notificación.
   * @param {Array} config.users - Array de objetos de usuario a notificar.
   * @param {Object} config.triggeringUser - El usuario que originó el evento.
   * @param {Object} [config.channels] - Canales a utilizar.
   * @param {Object} [config.channels.inApp] - Configuración para notificaciones in-app.
   * @param {Object} [config.channels.email] - Configuración para emails.
   * @param {Object} [config.channels.push] - Configuración para notificaciones push.
   */
  //

  dispatch({ users, triggeringUser, channels = {} }) {
    // "Fire-and-forget": Ejecuta todo en segundo plano.
    (async () => {
      try {
        if (!users || users.length === 0) {
          console.log("[NotificationService] No hay usuarios para notificar.");
          return;
        }

        // Deduplicar usuarios para asegurar que no haya envíos dobles
        const uniqueUsers = Array.from(
          new Map(users.map((user) => [user._id.toString(), user])).values()
        );

        if (channels.inApp) {
          await this._sendInApp(uniqueUsers, triggeringUser, channels.inApp);
        }
        if (channels.email) {
          await this._sendEmails(uniqueUsers, channels.email);
        }
        if (channels.push) {
          await this._sendPush(uniqueUsers, channels.push);
        }
      } catch (error) {
        console.error(
          "[NotificationService] Error en el despacho en segundo plano:",
          error
        );
      }
    })();
  }
  /**
   * Obtiene usuarios relevantes para notificaciones
   * @param {Object} idRefineria - Refinería asociada
   */
  async getRelevantUsers(idRefineria) {
    return await usuario.find({
      departamento: { $in: ["Finanzas"] },
      eliminado: false,
      $or: [
        { acceso: "completo" },
        { acceso: "limitado", idRefineria: idRefineria },
      ],
    });
  }

  /**
   * Envía notificaciones in-app
   * @param {Array} users - Usuarios a notificar
   * @param {String} title - Título de la notificación
   * @param {String} message - Mensaje de la notificación
   * @param {String} createdBy - ID del usuario creador
   * @param {String} link - Enlace relacionado
   */

  async _sendInApp(users, triggeringUser, { title, message, link }) {
    const notifications = users.map((user) => ({
      title,
      message,
      type: "in-app",
      createdBy: triggeringUser._id,
      read: false,
      userId: user._id,
      link,
    }));

    const saved = await notification.insertMany(notifications);
    saved.forEach((n) =>
      this.io.to(`user-${n.userId}`).emit("new-notification", n)
    );
  }
  /**
   * Envía notificaciones por email
   * @param {Array} users - Usuarios a notificar
   * @param {String} subject - Asunto del email
   * @param {String} templateName - Plantilla HTML con marcadores {nombre}
   * @param {String} entityId - ID de la entidad relacionada
   */

  async _sendEmails(users, { subject, templateName, context = {} }) {
    const templateFunction = templateMails[templateName];
    if (typeof templateFunction !== "function") {
      console.error(
        `[Email Service] La plantilla "${templateName}" no existe o no es una función.`
      );
      return;
    }

    for (const user of users) {
      if (user.correo) {
        try {
          const templateData = {
            ...context,
            nombreUsuario: user.nombre,
          };
          // Generar el HTML final llamando a la función de la plantilla
          const finalHtml = templateFunction(templateData);
          await sendEmail(user.correo, subject, finalHtml);
        } catch (error) {
          console.error(`Error enviando email a ${user.correo}:`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 500)); // Respetar rate limit
      }
    }
  }
  /**
   * Envía notificaciones push
   * @param {Array} users - Usuarios a notificar
   * @param {String} title - Título de la notificación
   * @param {String} body - Cuerpo del mensaje
   * @param {String} link - Enlace relacionado
   */

  async _sendPush(users, { title, body, link }) {
    // --- Auditoría y Deduplicación ---
    console.log(
      `[Push Audit] Iniciando envío. Recibidos ${users.length} usuarios.`
    );

    // 1. Deduplicar la lista de usuarios para evitar envíos múltiples al mismo usuario.
    const uniqueUsersMap = new Map(
      users.map((user) => [user._id.toString(), user])
    );
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    if (users.length !== uniqueUsers.length) {
      console.warn(
        `[Push Audit] Se encontraron ${
          users.length - uniqueUsers.length
        } usuarios duplicados. Se procesarán ${uniqueUsers.length} usuarios únicos.`
      );
    }

    // 2. Extraer tokens de los usuarios únicos.
    const tokensWithContext = uniqueUsers.flatMap((user) =>
      (user.fcmTokens || []).map((token) => ({
        token,
        userId: user._id.toString(),
      }))
    );

    if (tokensWithContext.length === 0) {
      console.log("[Push Audit] No hay tokens de FCM para enviar.");
      return [];
    }

    console.log(
      `[Push Audit] Preparando ${
        tokensWithContext.length
      } notificaciones para los tokens:`,
      tokensWithContext.map((t) => t.token)
    );

    // --- Construcción de Mensajes ---
    const messages = tokensWithContext.map(({ token, userId }) => ({
      token,
      notification: {
        title,
        body,
        imageUrl: `${process.env.BACKEND_URL}/images/logoMaroil.png`, // URL dinámica
      },
      webpush: {
        fcmOptions: {
          link: `https://maroil-refinery.vercel.app${link}`,
        },
        notification: {
          icon: `${process.env.BACKEND_URL}/images/logoMaroil.png`, // Icono para web
          badge: `${process.env.BACKEND_URL}/images/logoMaroil.png`, // Badge para móvil
          vibrate: [200, 100, 200], // Patrón de vibración
          actions: [
            {
              action: "open_link",
              title: "Ver más",
            },
          ],
        },
      },
      data: {
        userId: userId.toString(),
        link,
        type: "contract-notification",
      },
    }));

    // --- Envío y Manejo de Resultados ---
    try {
      // Usamos Promise.allSettled para procesar todos los envíos incluso si algunos fallan.
      const results = await Promise.allSettled(
        messages.map((msg) => admin.messaging().send(msg))
      );

      results.forEach((result, index) => {
        const tokenInfo = tokensWithContext[index];
        if (result.status === "fulfilled") {
          console.log(
            `[Push Audit] Éxito en envío a token ${tokenInfo.token} (Usuario: ${tokenInfo.userId})`
          );
        } else {
          // Auditoría de errores
          console.error(
            `[Push Audit] Falló el envío al token ${tokenInfo.token} (Usuario: ${tokenInfo.userId}):`,
            result.reason.message
          );

          // Lógica para limpiar tokens inválidos
          const errorCode = result.reason.code;
          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token"
          ) {
            console.warn(
              `[Push Cleanup] El token ${tokenInfo.token} es inválido. Se recomienda eliminarlo del usuario ${tokenInfo.userId}.`
            );
            // Descomenta la siguiente línea para eliminar automáticamente los tokens inválidos:
            // usuario.updateOne({ _id: tokenInfo.userId }, { $pull: { fcmTokens: tokenInfo.token } }).exec();
          }
        }
      });

      return results;
    } catch (error) {
      console.error(
        "Error inesperado durante el proceso de envío de notificaciones push:",
        error
      );
    }
  }
}

module.exports = NotificationService;
