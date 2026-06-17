// =====================================================
//  models/index.js
//  Carga todos los modelos y define las asociaciones
// =====================================================

const Usuario      = require('./Usuario');
const Otb          = require('./Otb');
const Cliente      = require('./Cliente');
const Conductor    = require('./Conductor');
const Tanque       = require('./Tanque');
const LecturaSensor = require('./LecturaSensor');
const Prediccion   = require('./Prediccion');
const Pedido       = require('./Pedido');
const Notificacion = require('./Notificacion');
const Calificacion = require('./Calificacion');
const SeguimientoPedido = require('./SeguimientoPedido');

// ── Usuario ↔ Cliente (1:1)
Usuario.hasOne(Cliente, { foreignKey: 'id_usuario', as: 'perfilCliente' });
Cliente.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// ── Usuario ↔ Conductor (1:1)
Usuario.hasOne(Conductor, { foreignKey: 'id_usuario', as: 'perfilConductor' });
Conductor.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// ── OTB ↔ Cliente (1:N)
Otb.hasMany(Cliente, { foreignKey: 'id_otb', as: 'clientes' });
Cliente.belongsTo(Otb, { foreignKey: 'id_otb', as: 'otb' });

// ── OTB ↔ Conductor (1:N)
Otb.hasMany(Conductor, { foreignKey: 'id_otb', as: 'conductores' });
Conductor.belongsTo(Otb, { foreignKey: 'id_otb', as: 'otb' });

// ── Cliente ↔ Tanque (1:N)
Cliente.hasMany(Tanque, { foreignKey: 'id_cliente', as: 'tanques' });
Tanque.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });

// ── Tanque ↔ LecturaSensor (1:N)
Tanque.hasMany(LecturaSensor, { foreignKey: 'id_tanque', as: 'lecturas' });
LecturaSensor.belongsTo(Tanque, { foreignKey: 'id_tanque', as: 'tanque' });

// ── Tanque ↔ Prediccion (1:N)
Tanque.hasMany(Prediccion, { foreignKey: 'id_tanque', as: 'predicciones' });
Prediccion.belongsTo(Tanque, { foreignKey: 'id_tanque', as: 'tanque' });

// ── Cliente ↔ Pedido (1:N)
Cliente.hasMany(Pedido, { foreignKey: 'id_cliente', as: 'pedidos' });
Pedido.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });

// ── Conductor ↔ Pedido (1:N)
Conductor.hasMany(Pedido, { foreignKey: 'id_conductor', as: 'pedidos' });
Pedido.belongsTo(Conductor, { foreignKey: 'id_conductor', as: 'conductor' });

// ── Pedido ↔ SeguimientoPedido (1:N)
Pedido.hasMany(SeguimientoPedido, { foreignKey: 'id_pedido', as: 'seguimientos' });
SeguimientoPedido.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'pedido' });

// ── Conductor ↔ SeguimientoPedido (1:N)
Conductor.hasMany(SeguimientoPedido, { foreignKey: 'id_conductor', as: 'seguimientos' });
SeguimientoPedido.belongsTo(Conductor, { foreignKey: 'id_conductor', as: 'conductor' });

// ── Usuario ↔ Notificacion (1:N)
Usuario.hasMany(Notificacion, { foreignKey: 'id_usuario', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// ── Pedido ↔ Notificacion (1:N)
Pedido.hasMany(Notificacion, { foreignKey: 'id_pedido', as: 'notificaciones' });
Notificacion.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'pedido' });

// ── Pedido ↔ Calificacion (1:1)
Pedido.hasOne(Calificacion, { foreignKey: 'id_pedido', as: 'detalleCalificacion' });
Calificacion.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'pedido' });

// ── Cliente ↔ Calificacion (1:N)
Cliente.hasMany(Calificacion, { foreignKey: 'id_cliente', as: 'calificaciones' });
Calificacion.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });

// ── Conductor ↔ Calificacion (1:N)
Conductor.hasMany(Calificacion, { foreignKey: 'id_conductor', as: 'calificaciones' });
Calificacion.belongsTo(Conductor, { foreignKey: 'id_conductor', as: 'conductor' });

module.exports = {
  Usuario,
  Otb,
  Cliente,
  Conductor,
  Tanque,
  LecturaSensor,
  Prediccion,
  Pedido,
  SeguimientoPedido,
  Notificacion,
  Calificacion,
};
