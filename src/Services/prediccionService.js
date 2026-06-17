// =====================================================
//  Servicio de Predicción IA
//  Calcula días restantes y genera alertas basadas
//  en el historial de lecturas del sensor.
// =====================================================
// const { LecturaSensor, Prediccion, Notificacion, Tanque, Cliente } = require('../models');
const { LecturaSensor, Prediccion, Notificacion, Tanque, Cliente } = require('../models');
const { Op } = require('sequelize');

/**
 * Calcula y guarda una predicción para un tanque.
 * Se llama automáticamente cada vez que llega una lectura del sensor.
 *
 * @param {number} id_tanque
 * @param {number} nivel_actual_litros - nivel en litros de la lectura más reciente
 * @param {number} capacidad_litros
 */
const calcularPrediccion = async (id_tanque, nivel_actual_litros, capacidad_litros) => {
  try {
    // Tomamos las últimas 14 lecturas para calcular consumo promedio
    const lecturas = await LecturaSensor.findAll({
      where: { id_tanque },
      order: [['fecha_registro', 'DESC']],
      limit: 14,
      attributes: ['nivel_litros', 'fecha_registro'],
    });

    if (lecturas.length < 2) {
      // Sin suficiente historial, solo guardamos el estado actual
      return null;
    }

    // Calcular consumo diario promedio usando regresión lineal simple
    const pares = [];
    for (let i = 0; i < lecturas.length - 1; i++) {
      const actual   = lecturas[i];
      const anterior = lecturas[i + 1];
      const diffLitros = anterior.nivel_litros - actual.nivel_litros;
      const diffHoras  = (new Date(anterior.fecha_registro) - new Date(actual.fecha_registro)) / 3600000;

      if (diffHoras > 0 && diffLitros > 0) {
        // Solo consideramos decrementos (consumo real)
        const litrosPorHora = diffLitros / diffHoras;
        pares.push(litrosPorHora * 24); // convertir a litros/día
      }
    }

    if (pares.length === 0) return null;

    // Promedio de consumo diario
    const consumoDiarioPromedio = pares.reduce((a, b) => a + b, 0) / pares.length;

    // Días restantes hasta llegar a 0
    const diasRestantes = consumoDiarioPromedio > 0
      ? Math.floor(nivel_actual_litros / consumoDiarioPromedio)
      : 999;

    // Fecha estimada de vaciado
    const fechaVacio = new Date();
    fechaVacio.setDate(fechaVacio.getDate() + diasRestantes);

    // Nivel estimado mañana
    const nivelManana = Math.max(0, nivel_actual_litros - consumoDiarioPromedio);

    // Nivel de alerta
    let nivel_alerta = 'ok';
    let mensaje_alerta = `Tu tanque está bien. Te quedan aproximadamente ${diasRestantes} días de agua.`;

    if (diasRestantes <= 1) {
      nivel_alerta  = 'critico';
      mensaje_alerta = '⚠️ ¡Tu tanque se agotará mañana! Pide agua ahora.';
    } else if (diasRestantes <= 3) {
      nivel_alerta  = 'advertencia';
      mensaje_alerta = `⚡ Te quedan solo ${diasRestantes} días de agua. Te recomendamos pedir hoy.`;
    } else if (diasRestantes <= 7) {
      nivel_alerta  = 'advertencia';
      mensaje_alerta = `💧 Te quedan ${diasRestantes} días de agua. Considera pedir esta semana.`;
    }

    // Guardar predicción
    const prediccion = await Prediccion.create({
      id_tanque,
      dias_restantes:          diasRestantes,
      fecha_estimacion_vacio:  fechaVacio,
      nivel_estimado_manana:   Math.round(nivelManana),
      consumo_diario_promedio: consumoDiarioPromedio.toFixed(2),
      nivel_al_calcular:       nivel_actual_litros,
      lecturas_usadas:         lecturas.length,
      mensaje_alerta,
      nivel_alerta,
    });

    // Generar notificación si el nivel de alerta cambió a crítico o advertencia
    if (nivel_alerta !== 'ok') {
      await _generarNotificacionTanque(id_tanque, mensaje_alerta, nivel_alerta);
    }

    return prediccion;
  } catch (error) {
    console.error('Error en calcularPrediccion:', error.message);
    return null;
  }
};

/**
 * Obtiene la predicción más reciente de un tanque.
 */
const obtenerUltimaPrediccion = async (id_tanque) => {
  return Prediccion.findOne({
    where: { id_tanque },
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Crea una notificación de alerta de tanque para el dueño.
 */
const _generarNotificacionTanque = async (id_tanque, mensaje, nivel_alerta) => {
  try {
    const tanque = await Tanque.findByPk(id_tanque, {
      include: [{ association: 'cliente', include: [{ association: 'usuario' }] }],
    });

    if (!tanque?.cliente?.usuario) return;

    const id_usuario = tanque.cliente.usuario.id_usuario;

    // Evitar notificaciones duplicadas en la misma hora
    const hace1hora = new Date(Date.now() - 3600000);
    const reciente = await Notificacion.findOne({
      where: {
        id_usuario,
        id_tanque,
        tipo: 'alerta_tanque',
        createdAt: { [Op.gte]: hace1hora },
      },
    });

    if (reciente) return; // Ya se notificó

    const titulo = nivel_alerta === 'critico'
      ? '🚨 Nivel crítico de agua'
      : '⚡ Nivel bajo de agua';

    await Notificacion.create({
      id_usuario,
      id_tanque,
      titulo,
      mensaje,
      tipo: 'alerta_tanque',
    });
  } catch (error) {
    console.error('Error generando notificación de tanque:', error.message);
  }
};

module.exports = { calcularPrediccion, obtenerUltimaPrediccion };