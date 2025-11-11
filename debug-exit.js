const axios = require("axios");

async function debugExit() {
  try {
    // Get token
    const loginResponse = await axios.post(
      "http://localhost:4000/api/auth/login",
      {
        correo: "admin@test.com",
        password: "123456",
      }
    );
    const token = loginResponse.data.token;

    // Get work orders
    const woResponse = await axios.get(
      "http://localhost:4000/api/work-orders",
      {
        headers: { "x-token": token },
      }
    );

    if (!woResponse.data.data || woResponse.data.data.length === 0) {
      console.log("No work orders available");
      return;
    }

    const workOrder = woResponse.data.data[0];
    console.log("Work order:", workOrder._id);

    // Get bays
    const bayResponse = await axios.get(
      "http://localhost:4000/api/service-bays",
      {
        headers: { "x-token": token },
      }
    );

    const availableBay = bayResponse.data.bays.find(
      (b) => b.status === "disponible"
    );
    if (!availableBay) {
      console.log("No available bays");
      return;
    }

    console.log("Available bay:", availableBay._id);

    // Get technicians
    const techResponse = await axios.get(
      "http://localhost:4000/api/users?role=tecnico",
      {
        headers: { "x-token": token },
      }
    );

    const technician = techResponse.data.usuarios[0];
    console.log("Technician:", technician._id);

    // Enter bay
    const enterResponse = await axios.post(
      `http://localhost:4000/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: availableBay._id,
        technician: technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Debug test",
      },
      {
        headers: { "x-token": token },
      }
    );

    console.log(
      "Enter response:",
      enterResponse.status,
      JSON.stringify(enterResponse.data, null, 2)
    );

    const assignment =
      enterResponse.data.assignments?.[0] || enterResponse.data.assignment;
    console.log("Assignment ID:", assignment._id);

    // Exit bay
    const exitResponse = await axios.post(
      `http://localhost:4000/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician._id,
        notes: "Debug exit",
      },
      {
        headers: { "x-token": token },
      }
    );

    console.log(
      "Exit response:",
      exitResponse.status,
      JSON.stringify(exitResponse.data, null, 2)
    );
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error("Stack:", error.response.data.error);
    }
  }
}

debugExit();
