const request = require("supertest");
const app = require("../app"); // Asegúrate de que este sea el path correcto a tu aplicación
const {
  ServiceBay,
} = require("../features/workshop/service-bay/models/serviceBay.model");

describe("Service Bay API", () => {
  let serviceBayId;

  beforeAll(async () => {
    // Limpiar la colección antes de comenzar
    await ServiceBay.deleteMany({});
  });

  test("Crear una nueva bahía de servicio", async () => {
    const response = await request(app)
      .post("/api/service-bays")
      .send({
        name: "Bahía de Prueba",
        code: "TEST01",
        area: "mecanica",
        capacity: "mediana",
      })
      .expect(201);

    expect(response.body.ok).toBe(true);
    expect(response.body.bay.name).toBe("Bahía de Prueba");
    serviceBayId = response.body.bay._id;
  });

  test("Obtener todas las bahías de servicio", async () => {
    const response = await request(app).get("/api/service-bays").expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.total).toBeGreaterThan(0);
  });

  test("Obtener una bahía por ID", async () => {
    const response = await request(app)
      .get(`/api/service-bays/${serviceBayId}`)
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.bay._id).toBe(serviceBayId);
  });

  test("Actualizar una bahía", async () => {
    const response = await request(app)
      .put(`/api/service-bays/${serviceBayId}`)
      .send({
        name: "Bahía Actualizada",
      })
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.bay.name).toBe("Bahía Actualizada");
  });

  test("Eliminar una bahía (lógicamente)", async () => {
    const response = await request(app)
      .delete(`/api/service-bays/${serviceBayId}`)
      .expect(200);

    expect(response.body.ok).toBe(true);
  });

  test("Obtener bahías disponibles", async () => {
    const response = await request(app)
      .get("/api/service-bays/available")
      .expect(200);

    expect(response.body.ok).toBe(true);
  });
});
