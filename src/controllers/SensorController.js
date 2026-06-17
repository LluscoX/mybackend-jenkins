// =====================================================
//  controllers/SensorController.js
//  Recibe lecturas del sensor ultrasónico IoT.
//
//  El dispositivo hace POST /api/sensor/lectura con:
//    Header:  x-sensor-token: <token_sensor del tanque>
//    Body:    { distancia_cm: 23.5, fecha_registro: "..." }
//
//  El backend calcula nivel_cm, nivel_litros y porcentaje,
//  actualiza el tanque y dispara la predicción IA.
// =====================================================

const { Tanque, LecturaSensor } = require('../models');
const { calcularPrediccion } = require('../services/prediccionService');

// ─────────────────────────────────────────────────────────
//  POST /api/sensor/lectura
//  Endpoint principal que llama el sensor IoT
// ─────────────────────────────────────────────────────────
const recibirLectura = async (req, res) => {
  try {
    const tokenSensor = req.headers['x-sensor-token'];

    if (!tokenSensor) {
      return res.status(401).json({ ok: false, mensaje: 'Token de sensor requerido (x-sensor-token)' });
    }

    // Buscar el tanque por su token único
    const tanque = await Tanque.findOne({ where: { token_sensor: tokenSensor, activo: 1 } });
    if (!tanque) {
      return res.status(404).json({ ok: false, mensaje: 'Sensor no registrado o tanque inactivo' });
    }

    const { distancia_cm, fecha_registro } = req.body;
    console.log("📡 REQUEST RECIBIDO");
    console.log("Token:", tokenSensor);
    console.log("Distancia:", distancia_cm);
    console.log("Fecha:", fecha_registro);

    if (distancia_cm == null || isNaN(distancia_cm)) {
      return res.status(400).json({ ok: false, mensaje: 'distancia_cm es requerida y debe ser un número' });
    }

    const distancia = parseFloat(distancia_cm);
    const alturaTanque = tanque.altura_tanque_cm;

    if (!alturaTanque || alturaTanque <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El tanque no tiene configurada la altura (altura_tanque_cm). Configúralo desde el panel admin.',
      });
    }

    // ── Cálculos del sensor ──────────────────────────────
    // El sensor mide desde arriba hacia abajo.
    // nivel_cm = altura total del tanque - distancia al agua
    const nivel_cm = Math.max(0, alturaTanque - distancia);

    // Calculamos litros proporcionales a la altura
    // (asume tanque de sección constante — cilindro o caja)
    const nivel_litros = Math.round(
      (nivel_cm / alturaTanque) * tanque.capacidad_litros
    );

    const porcentaje = parseFloat(
      ((nivel_cm / alturaTanque) * 100).toFixed(2)
    );

    const fechaLectura = fecha_registro ? new Date(fecha_registro) : new Date();

    // ── Guardar lectura ───────────────────────────────────
    const lectura = await LecturaSensor.create({
      id_tanque: tanque.id_tanque,
      distancia_cm: distancia,
      nivel_cm,
      nivel_litros,
      porcentaje,
      fecha_registro: fechaLectura,
    });

    // ── Actualizar estado actual del tanque ──────────────
    await tanque.update({
      nivel_actual: nivel_litros,
      porcentaje_actual: porcentaje,
      ultima_lectura: fechaLectura,
    });

    // ── Disparar predicción IA (asíncrona, no bloquea) ───
    calcularPrediccion(tanque.id_tanque, nivel_litros, tanque.capacidad_litros)
      .catch(err => console.error('Error en predicción:', err.message));

    res.status(201).json({
      ok: true,
      mensaje: 'Lectura registrada correctamente',
      lectura: {
        id_lectura: lectura.id_lectura,
        distancia_cm: distancia,
        nivel_cm,
        nivel_litros,
        porcentaje,
        fecha_registro: fechaLectura,
      },

    });
  } catch (error) {
    console.error('Error en recibirLectura:', error);
    res.status(500).json({ ok: false, mensaje: 'Error procesando lectura del sensor' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/sensor/ping
//  El sensor puede hacer ping para verificar conectividad
// ─────────────────────────────────────────────────────────
const ping = (req, res) => {
  res.json({ ok: true, mensaje: 'pong', timestamp: new Date().toISOString() });
};

module.exports = { recibirLectura, ping };