const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const nodemailer = require("nodemailer");
const port = process.env.PORT || 3000;

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use(
  session({
    secret: "tu_secreto",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Asegúrate de usar secure: true en producción con HTTPS
  })
);

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool
  .getConnection()
  .then((connection) => {
    console.log("Conexión a la base de datos establecida correctamente.");
    connection.release();
  })
  .catch((err) => {
    console.error("Error al conectar con la base de datos:", err);
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Middleware para verificar el token JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];
  console.log("Token extraído:", token);

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Error al verificar el token:", err);
      return res.status(403).json({ error: "Token inválido" });
    }

    req.userId = user.userId; // Decodificar el userId del token
    console.log("User ID decodificado:", req.userId);
    next();
  });
}

// Middleware para verificar el rol de administrador
function verifyAdminRole(req, res, next) {
  const { userRole } = req; // Asegúrate de que el rol del usuario esté disponible en req

  if (userRole !== "admin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  next();
}

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  host: "c2660813.ferozo.com", // Servidor SMTP de Ferozo
  port: 465, // Puerto SMTP con SSL
  secure: true, // true para puerto 465
  auth: {
    user: process.env.EMAIL_USER, // Configura estas variables de entorno
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});


// Función para enviar el correo de notificación
async function enviarCorreoNotificacion(solicitudId, clienteId, fechaSolicitud) {
  try {
    // Obtener el correo del cliente
    const [clientes] = await pool.query(
      "SELECT Email FROM clientes WHERE cliente_id = ?",
      [clienteId]
    );
    const clienteEmail =
      clientes.length > 0 ? clientes[0].Email : "Desconocido";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "comercial@paradiseushuaia.com", // Reemplaza con el correo de administración
      subject: "Nueva Solicitud de Reserva",
      text: `Nueva solicitud de reserva registrada.

      ID de Solicitud: ${solicitudId}
      Correo del Usuario: ${clienteEmail}
      Fecha de la Solicitud: ${fechaSolicitud}`,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);
    console.log("Correo de notificación enviado exitosamente");
  } catch (error) {
    console.error("Error al enviar el correo de notificación:", error);
  }
}

// Registro de usuarios
app.post("/clientes", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);

    const {
      Nombres,
      Apellidos,
      fechaNacimiento,
      Sexo,
      Email,
      Num_telefono,
      password,
      Pais,
    } = req.body;

    // Verificar cada campo individualmente
    if (!Nombres) console.log("Falta Nombres");
    if (!Apellidos) console.log("Falta Apellidos");
    if (!fechaNacimiento) console.log("Falta fechaNacimiento");
    if (!Sexo) console.log("Falta Sexo");
    if (!Email) console.log("Falta Email");
    if (!Num_telefono) console.log("Falta Num_telefono");
    if (!password) console.log("Falta password");
    if (!Pais) console.log("Falta Pais");

    if (
      !Nombres ||
      !Apellidos ||
      !fechaNacimiento ||
      !Sexo ||
      !Email ||
      !Num_telefono ||
      !password ||
      !Pais
    ) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Hasheando la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Contraseña hasheada:", hashedPassword);

    // Insertar el usuario en la base de datos
    const [result] = await pool.query(
      "INSERT INTO clientes (Nombres, Apellidos, Fecha_nacimiento, Sexo, Email, Num_telefono, Pais, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        Nombres,
        Apellidos,
        fechaNacimiento,
        Sexo,
        Email,
        Num_telefono,
        Pais,
        hashedPassword,
      ]
    );

    console.log("Usuario insertado, ID:", result.insertId);
    res
      .status(201)
      .json({
        message: "Usuario creado exitosamente",
        userId: result.insertId,
      });
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    res
      .status(500)
      .json({ error: "Error al crear el usuario", details: error.message });
  }
});

// Inicio de sesión
app.post("/login", async (req, res) => {
  try {
    const { Email, password } = req.body;

    // Buscar el usuario por email
    const [users] = await pool.query("SELECT * FROM clientes WHERE Email = ?", [
      Email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = users[0];

    // Comparar la contraseña ingresada con la contraseña hasheada almacenada
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar un token JWT con el rol de usuario
    const token = jwt.sign(
      { userId: user.cliente_id, userRole: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.rol });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// Ruta protegida para admin.html
app.get("/admin.html", verifyToken, verifyAdminRole, (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Obtener información del usuario
app.get("/usuarios/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const escapedId = pool.escape(id); // Escapar el parámetro id

    const [users] = await pool.query(
      "SELECT ID, Nombres, Apellidos, Edad, Sexo, Email, Num_telefono FROM usuarios WHERE ID = ?",
      [escapedId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(users[0]);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener la información del usuario" });
  }
});

// Actualizar información del usuario
app.put("/usuarios/:id", verifyToken, async (req, res) => {
  try {
    const {
      Nombres,
      Apellidos,
      Fecha_nacimiento,
      Sexo,
      Email,
      Num_telefono,
      Pais,
    } = req.body;
    const userId = req.params.id;

    // Verificar que el usuario está actualizando su propia información
    if (userId != req.userId) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar esta información" });
    }

    // Crear un objeto con los campos a actualizar
    const updateFields = {};
    if (Nombres) updateFields.Nombres = Nombres;
    if (Apellidos) updateFields.Apellidos = Apellidos;
    if (Fecha_nacimiento) updateFields.Fecha_nacimiento = Fecha_nacimiento;
    if (Pais) updateFields.Pais = Pais;
    if (Sexo) updateFields.Sexo = Sexo;
    if (Email) updateFields.Email = Email;
    if (Num_telefono) updateFields.Num_telefono = Num_telefono;

    // Construir la consulta SQL dinámicamente
    const setClause = Object.keys(updateFields)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateFields);
    values.push(userId);

    const query = `UPDATE clientes SET ${setClause} WHERE cliente_id = ?`;

    await pool.query(query, values);

    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res
      .status(500)
      .json({
        error: "Error al actualizar el usuario",
        details: error.message,
      });
  }
});

// Eliminar usuario
app.delete("/usuarios/:id", verifyToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM usuarios WHERE ID = ?", [req.params.id]);
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el usuario" });
  }
});

// Endpoint para autenticar al usuario y obtener su información
app.get("/auth/me", verifyToken, async (req, res) => {
  try {
    console.log("Iniciando autenticación de usuario");
    console.log("ID de usuario a autenticar:", req.userId);

    const [users] = await pool.query(
      "SELECT cliente_id, Nombres, Apellidos, Email, Num_telefono, Fecha_nacimiento, Sexo, Pais FROM clientes WHERE cliente_id = ?",
      [req.userId]
    );
    console.log("Consulta ejecutada. Resultado:", users);

    if (users.length === 0) {
      console.log("Usuario no encontrado");
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = users[0];
    console.log("Usuario autenticado:", user);

    // Devolver la información del usuario autenticado
    res.json({
      message: "Autenticación exitosa",
      user: {
        id: user.cliente_id, // Aquí se ajusta el id
        nombres: user.Nombres,
        apellidos: user.Apellidos,
        email: user.Email,
        Fecha_nacimiento: user.Fecha_nacimiento,
        sexo: user.Sexo,
        telefono: user.Num_telefono,
        pais: user.Pais,
      },
    });
  } catch (error) {
    console.error("Error durante la autenticación:", error);
    res.status(500).json({
      error: "Error al autenticar al usuario",
      details: error.message,
    });
  }
});


// ... (código existente) ...

app.post("/cambiar-password", verifyToken, async (req, res) => {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    const userId = req.userId;

    // Validaciones en el servidor
    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Obtener el usuario de la base de datos
    const [users] = await pool.query(
      "SELECT * FROM clientes WHERE cliente_id = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const user = users[0];

    // Verificar la contraseña actual
    const passwordValida = await bcrypt.compare(passwordActual, user.password);
    if (!passwordValida) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    // Verificar que la nueva contraseña sea diferente de la actual
    const nuevaPasswordValida = await bcrypt.compare(
      nuevaPassword,
      user.password
    );
    if (nuevaPasswordValida) {
      return res
        .status(400)
        .json({ error: "La nueva contraseña debe ser diferente a la actual" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar la contraseña en la base de datos
    await pool.query("UPDATE clientes SET password = ? WHERE cliente_id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Contraseña cambiada exitosamente" });
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});

// Endpoint para agregar al carrito
app.post("/api/carrito/agregar", verifyToken, async (req, res) => {
  const clienteId = req.userId;
  const {
    tourId,
    cantidad,
    edades,
    fechaInicio,
    fechaFin,
    fechaTour,
    subTotal,
  } = req.body;

  try {
    const [result] = await pool.query(
      "INSERT INTO Carrito (Cliente_ID, Tour_ID, Cantidad_personas, Edad_Personas, Fecha_inicio, Fecha_fin, Fecha_Tour, sub_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        clienteId,
        tourId,
        cantidad,
        JSON.stringify(edades),
        fechaInicio,
        fechaFin,
        fechaTour,
        subTotal,
      ]
    );

    res.json({ success: true, message: "Item agregado al carrito", subTotal });
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al agregar al carrito" });
  }
});

// Obtener el conteo de items en el carrito
app.get("/api/carrito/contar", verifyToken, async (req, res) => {
  const clienteId = req.userId;

  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM Carrito WHERE Cliente_ID = ?",
      [clienteId]
    );

    res.json({ count: rows[0].count });
  } catch (error) {
    console.error("Error al contar items del carrito:", error);
    res.status(500).json({ error: "Error al contar items del carrito" });
  }
});

app.get("/api/carrito", verifyToken, async (req, res) => {
  const clienteId = req.userId;
  try {
    const [items] = await pool.query(
      `SELECT c.*, t.Nombre_tour, t.Precio_unitario 
           FROM Carrito c
           JOIN Tours t ON c.Tour_ID = t.ID
           WHERE c.Cliente_ID = ?`,
      [clienteId]
    );

    items.forEach((item) => {
      if (typeof item.Edad_Personas === "string") {
        try {
          item.Edad_Personas = JSON.parse(item.Edad_Personas);
        } catch (error) {
          console.error("Error al parsear Edad_Personas:", error);
          item.Edad_Personas = item.Edad_Personas.split(",").map(Number);
        }
      }
    });

    const total = items.reduce(
      (sum, item) => sum + item.Precio_unitario * item.Cantidad_personas,
      0
    );
    res.json({ success: true, items, total });
  } catch (error) {
    console.error("Error al obtener el carrito:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener el carrito" });
  }
});

// Eliminar un item del carrito
app.delete("/api/carrito/eliminar/:itemId", verifyToken, async (req, res) => {
  const { itemId } = req.params;
  const clienteId = req.userId;

  try {
    await pool.query("DELETE FROM Carrito WHERE ID = ? AND Cliente_ID = ?", [
      itemId,
      clienteId,
    ]);
    res.json({ success: true, message: "Item eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el item del carrito:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar el item" });
  }
});

// Endpoint para editar un item del carrito
app.put("/api/carrito/editar/:itemId", verifyToken, async (req, res) => {
  const { itemId } = req.params;
  const {
    cantidad,
    fechaTour,
    fechaInicio,
    fechaFin,
    edades,
    subTotal,
  } = req.body;

  try {
    await pool.query(
      "UPDATE Carrito SET Cantidad_personas = ?, Edad_Personas = ?, Fecha_inicio = ?, Fecha_fin = ?, Fecha_Tour = ?, sub_total = ? WHERE ID = ?",
      [
        cantidad,
        JSON.stringify(edades),
        fechaInicio,
        fechaFin,
        fechaTour,
        subTotal,
        itemId,
      ]
    );

    res.json({ success: true, message: "Item actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el item:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al actualizar el item" });
  }
});

//solicitudes de reserva

// Endpoint existente para registrar una nueva solicitud de reserva
app.post("/api/solicitud/crear", verifyToken, async (req, res) => {
  const clienteId = req.userId;
  const { solicitudes, asesoriaAlojamiento, divisa } = req.body;
  
  try {
    await pool.query("START TRANSACTION");
    const fechaActual = new Date().toISOString().slice(0, 10);
    
    // Calcular el total sumando los subtotales de cada solicitud
    const total = solicitudes.reduce((acc, curr) => acc + parseFloat(curr.subTotal), 0);

    // Insertar en la tabla Solicitud con el total y la divisa
    const [solicitudResult] = await pool.query(
      "INSERT INTO Solicitud (Cliente_ID, Fecha_solicitud, Estado, Total, asesoria_alojamiento, divisa) VALUES (?, ?, ?, ?, ?, ?)",
      [clienteId, fechaActual, "pendiente", total.toFixed(2), asesoriaAlojamiento, divisa]
    );
    
    const solicitudId = solicitudResult.insertId;

    // Insertar cada tour en la tabla Detalle_Solicitud
    for (const solicitud of solicitudes) {
      const subTotal = parseFloat(solicitud.subTotal);
      await pool.query(
        "INSERT INTO Detalle_Solicitud (Solicitud_ID, Tour_ID, Cantidad_personas, Edad_Personas, Fecha_inicio, Fecha_fin, Fecha_Tour, sub_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          solicitudId,
          solicitud.tourId,
          solicitud.cantidadPersonas,
          JSON.stringify(solicitud.edades),
          solicitud.fechaInicio,
          solicitud.fechaFin,
          solicitud.fechaTour,
          subTotal.toFixed(2)
        ]
      );
    }

    // Vaciar el carrito
    await pool.query("DELETE FROM Carrito WHERE Cliente_ID = ?", [clienteId]);
    
    await pool.query("COMMIT");
    
    res.json({ 
      success: true, 
      message: "Solicitud creada correctamente",
      solicitudId: solicitudId,
      total: total.toFixed(2),
      divisa: divisa
    });

    // Enviar correo de notificación
    await enviarCorreoNotificacion(solicitudId, clienteId, fechaActual);
  } 
  catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al crear la solicitud:", error);
    res.status(500).json({ success: false, message: "Error al crear la solicitud" });
  }
});



// ADMINISTRACION

// Obtener la lista de usuarios
app.get("/users", verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT cliente_id, Nombres, Apellidos, Email FROM clientes"
    );
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Obtener detalles de un usuario específico
app.get("/users/:id", verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT cliente_id, Nombres, Apellidos, Email, Num_telefono, Fecha_nacimiento, Sexo, Pais FROM clientes WHERE cliente_id = ?",
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Error al obtener detalles del usuario:", error);
    res.status(500).json({ error: "Error al obtener detalles del usuario" });
  }
});

// Eliminar usuario
app.delete("/users/:id", verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM clientes WHERE cliente_id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    res.status(500).json({ error: "Error al eliminar el usuario" });
  }
});

// Actualizar información de un usuario
app.put("/users/:id", verifyToken, async (req, res) => {
  try {
    const {
      Nombres,
      Apellidos,
      Email,
      Num_telefono,
      Fecha_nacimiento,
      Sexo,
      Pais,
    } = req.body;
    const result = await pool.query(
      "UPDATE clientes SET Nombres = ?, Apellidos = ?, Email = ?, Num_telefono = ?, Fecha_nacimiento = ?, Sexo = ?, Pais = ? WHERE cliente_id = ?",
      [
        Nombres,
        Apellidos,
        Email,
        Num_telefono,
        Fecha_nacimiento,
        Sexo,
        Pais,
        req.params.id,
      ]
    );
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// Obtener la lista de reservas con email del cliente
app.get("/reservations", verifyToken, async (req, res) => {
  try {
    const [reservations] = await pool.query(`
      SELECT s.ID, s.Cliente_ID, c.Email, s.Fecha_solicitud, s.Estado, s.Total
      FROM solicitud s
      JOIN Clientes c ON s.Cliente_ID = c.cliente_id
    `);
    res.json(reservations);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error al obtener reservas" });
  }
});

app.get("/reservations/user/:id", verifyToken, async (req, res) => {
  try {
      const userId = req.params.id;
      console.log('Fetching reservations for user:', userId);
      const [reservations] = await pool.query(`
          SELECT s.ID, s.Cliente_ID, c.Email, s.Fecha_solicitud, s.Estado, s.Total, s.asesoria_alojamiento, s.divisa
          FROM solicitud s
          JOIN Clientes c ON s.Cliente_ID = c.cliente_id
          WHERE c.cliente_id = ?
      `, [userId]);
      console.log('Reservations found:', reservations.length);
      res.json(reservations);
  } catch (error) {
      console.error("Error al obtener mis reservas:", error);
      res.status(500).json({ error: "Error al obtener mis reservas" });
  }
});

//solicitudes

// Obtener información de una solicitud específica
app.get("/reservations/:id", verifyToken, async (req, res) => {
  try {
    const [reservationDetails] = await pool.query(
      `SELECT s.ID, s.Cliente_ID, c.Nombres, c.Apellidos, c.Email, s.Fecha_solicitud, s.Estado, s.Total, s.asesoria_alojamiento, s.divisa,
              ds.Tour_ID, ds.Cantidad_personas, ds.Edad_Personas, ds.Fecha_inicio, ds.Fecha_fin, ds.Fecha_Tour, ds.Sub_total, 
              t.Nombre_tour, t.Capacidad, t.Precio_unitario, t.Precio_menores
       FROM solicitud s
       JOIN Clientes c ON s.Cliente_ID = c.cliente_id
       JOIN detalle_solicitud ds ON s.ID = ds.Solicitud_ID
       JOIN Tours t ON ds.Tour_ID = t.ID
       WHERE s.ID = ?`,
      [req.params.id]
    );

    if (reservationDetails.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const reservation = {
      ID: reservationDetails[0].ID,
      Cliente_ID: reservationDetails[0].Cliente_ID,
      Nombres: reservationDetails[0].Nombres,
      Apellidos: reservationDetails[0].Apellidos,
      Email: reservationDetails[0].Email,
      Fecha_solicitud: reservationDetails[0].Fecha_solicitud,
      Estado: reservationDetails[0].Estado,
      Alojamiento: reservationDetails[0].asesoria_alojamiento,
      Total: reservationDetails[0].Total,
      divisa: reservationDetails[0].divisa,
      tours: reservationDetails.map((detail) => ({
        Tour_ID: detail.Tour_ID,
        Nombre_tour: detail.Nombre_tour,
        Cantidad_personas: detail.Cantidad_personas,
        Edad_Personas: JSON.parse(detail.Edad_Personas),
        Fecha_inicio: detail.Fecha_inicio,
        Fecha_fin: detail.Fecha_fin,
        Fecha_Tour: detail.Fecha_Tour,
        Sub_total: detail.Sub_total,
        Capacidad: detail.Capacidad,
        Precio_unitario: detail.Precio_unitario,
        Precio_menores: detail.Precio_menores
      })),
    };

    res.json(reservation);
  } catch (error) {
    console.error("Error al obtener detalles de la reserva:", error);
    res.status(500).json({ error: "Error al obtener detalles de la reserva" });
  }
});



// Eliminar una reserva
app.delete("/reservations/:id", verifyToken, async (req, res) => {
  try {
    const reservationId = req.params.id;
    // Eliminar detalle de la solicitud
    await pool.query("DELETE FROM detalle_solicitud WHERE Solicitud_ID = ?", [
      reservationId,
    ]);
    // Eliminar la solicitud
    await pool.query("DELETE FROM solicitud WHERE ID = ?", [reservationId]);
    res.json({ message: "Reserva eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar reserva:", error);
    res.status(500).json({ error: "Error al eliminar reserva" });
  }
});


// Obtener detalles de un cliente específico
app.get("/clients/:id", verifyToken, async (req, res) => {
  try {
    const [clients] = await pool.query(
      `
      SELECT cliente_id, Nombres, Apellidos, Email, Sexo, Fecha_nacimiento, Num_telefono, Pais
      FROM Clientes
      WHERE cliente_id = ?
    `,
      [req.params.id]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(clients[0]);
  } catch (error) {
    console.error("Error al obtener detalles del cliente:", error);
    res.status(500).json({ error: "Error al obtener detalles del cliente" });
  }
});


// Actualizar información de un cliente
app.put("/clients/:id", verifyToken, async (req, res) => {
  try {
    const {
      Nombres,
      Apellidos,
      Email,
      Sexo,
      Fecha_nacimiento,
      Num_telefono,
      Pais,
      password,
    } = req.body;
    let query = `
      UPDATE Clientes 
      SET Nombres = ?, Apellidos = ?, Email = ?, Sexo = ?, Fecha_nacimiento = ?, Num_telefono = ?, Pais = ?
      WHERE cliente_id = ?
    `;
    let params = [
      Nombres,
      Apellidos,
      Email,
      Sexo,
      Fecha_nacimiento,
      Num_telefono,
      Pais,
      req.params.id,
    ];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE Clientes 
        SET Nombres = ?, Apellidos = ?, Email = ?, Sexo = ?, Fecha_nacimiento = ?, Num_telefono = ?, Pais = ?, password = ?
        WHERE cliente_id = ?
      `;
      params = [
        Nombres,
        Apellidos,
        Email,
        Sexo,
        Fecha_nacimiento,
        Num_telefono,
        Pais,
        hashedPassword,
        req.params.id,
      ];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ message: "Cliente actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});



// Actualizar el detalle de una reserva
app.put("/reservations/:id", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { Estado, Total, divisa, tours } = req.body;
    const reservationId = req.params.id;

    // Actualizar la solicitud
    await connection.query(
      "UPDATE solicitud SET Estado = ?, Total = ?, divisa = ? WHERE ID = ?",
      [Estado, Total, divisa, reservationId]
    );

    // Eliminar los detalles existentes
    await connection.query(
      "DELETE FROM detalle_solicitud WHERE Solicitud_ID = ?",
      [reservationId]
    );

    // Insertar los nuevos detalles
    for (const tour of tours) {
      await connection.query(
        `INSERT INTO detalle_solicitud 
         (Solicitud_ID, Tour_ID, Cantidad_personas, Edad_Personas, Fecha_inicio, Fecha_fin, Fecha_Tour, Sub_total) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reservationId,
          tour.Tour_ID,
          tour.Cantidad_personas,
          JSON.stringify(tour.Edad_Personas),
          tour.Fecha_inicio,
          tour.Fecha_fin,
          tour.Fecha_Tour,
          tour.Sub_total,
        ]
      );
    }

    await connection.commit();
    res.json({ message: "Reserva actualizada exitosamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar reserva:", error);
    res.status(500).json({ error: "Error al actualizar la reserva" });
  } finally {
    connection.release();
  }
});


// Generar enlace de pago para una reserva usando Mercado Pago
app.post("/generate-payment/:id", verifyToken, async (req, res) => {
  try {
    const reservationId = req.params.id;

    // Obtener detalles de la reserva
    const [reservation] = await pool.query(
      "SELECT * FROM Solicitud WHERE ID = ?",
      [reservationId]
    );
    if (reservation.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // Aquí deberías implementar la lógica para generar un enlace de pago con Mercado Pago
    // Esto implica usar la API de Mercado Pago para crear una preferencia de pago

    // Ejemplo (necesitarás configurar el SDK de Mercado Pago):
    // const preference = {
    //   items: [
    //     {
    //       title: `Reserva #${reservationId}`,
    //       unit_price: reservation[0].Precio_Total,
    //       quantity: 1,
    //     }
    //   ],
    //   external_reference: reservationId.toString(),
    // };
    // const response = await mercadopago.preferences.create(preference);
    // const paymentLink = response.body.init_point;

    // Por ahora, simulamos un enlace de pago
    const paymentLink = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${reservationId}`;

    // Actualizar la reserva con el enlace de pago
    await pool.query("UPDATE Solicitud SET EnlacePago = ? WHERE ID = ?", [
      paymentLink,
      reservationId,
    ]);

    res.json({ paymentLink });
  } catch (error) {
    console.error("Error al generar enlace de pago:", error);
    res.status(500).json({ error: "Error al generar enlace de pago" });
  }
});

//Estado Solicitud usuario

app.get("/myreservations", verifyToken, async (req, res) => {
  try {
    const [reservations] = await pool.query(
      `
      SELECT s.ID, s.Cliente_ID, c.Email, s.Fecha_solicitud, s.Estado 
      FROM solicitud s
      JOIN Clientes c ON s.Cliente_ID = c.cliente_id
      WHERE c.cliente_id = ?
    `,
      [req.usuario.id]
    );
    res.json(reservations);
  } catch (error) {
    console.error("Error al obtener mis reservas:", error);
    res.status(500).json({ error: "Error al obtener mis reservas" });
  }
});

// Endpoint para obtener detalles de un tour específico
app.get("/api/tours/:id", verifyToken, async (req, res) => {
  try {
    const [tourDetails] = await pool.query(
      "SELECT ID, Nombre_tour, Capacidad, Precio_unitario, Precio_menores FROM tours WHERE ID = ?",
      [req.params.id]
    );

    if (tourDetails.length === 0) {
      return res.status(404).json({ error: "Tour no encontrado" });
    }

    res.json(tourDetails[0]);
  } catch (error) {
    console.error("Error al obtener detalles del tour:", error);
    res.status(500).json({ error: "Error al obtener detalles del tour" });
  }
});