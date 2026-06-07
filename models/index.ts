export type Rol = "ADMIN" | "CLIENTE" | "COCINERO" | "REPARTIDOR";

export interface Usuario {
  id: number;
  correo: string;
  nombre: string;
  apellido: string;
  tipoDocumento?: string | null;
  documento?: string | null;
  nacimiento?: string | null;
  direccionId?: number | null;
  rol: Rol;
  createdAt?: string;
  updatedAt?: string;
}

export interface Imagen {
  id: number;
  imagenSi: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Plato {
  id: number;
  seccionId: number;
  nombre: string;
  precio: number;
  detalle?: string | null;
  imagenId?: number | null;
  imagen?: Imagen | null;
}

export interface Seccion {
  id: number;
  cartaId: number;
  nombre: string;
  detalle?: string | null;
  platos?: Plato[];
}

export interface Carta {
  id: number;
  secciones?: Seccion[];
  createdAt?: string;
  updatedAt?: string;
}

export type EstadoComanda = "SIN_ASIGNAR" | "ASIGNADO" | "EN_COCINA" | "LISTO";
export type EstadoRecorrido = "PENDIENTE" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";

export interface Direccion {
  id: number;
  barrio?: string | null;
  calle?: string | null;
  manzanaPiso?: string | null;
  numeracion?: string | null;
  referencia?: string | null;
  casaDepto?: string | null;
  localidadId: number;
}

export interface Comanda {
  id: number;
  clienteId?: number | null;
  estadoComanda?: EstadoComanda | null;
  fechaSolicitud: string;
  fechaEntrega?: string | null;
  detalles?: DetalleComanda[];
  comandaAplicacion?: ComandaAplicacion | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComandaAplicacion {
  id: number;
  comandaId: number;
  direccionId?: number | null;
  direccion?: Direccion | null;
  recorridos?: Recorrido[];
}

export interface DetalleComanda {
  id: number;
  comandaId: number;
  empleadoId?: number | null;
  platoId: number;
  plato?: Plato;
  precioUnitario: number;
}

export interface Recorrido {
  id: number;
  comandaAplicacionId?: number | null;
  empleadoId?: number | null;
  estado?: EstadoRecorrido | null;
  fechaFin?: string | null;
  fechaIn?: string | null;
  coordIn?: string | null; // e.g. "lat,lng"
  coordFin?: string | null; // e.g. "lat,lng"
  createdAt?: string;
  updatedAt?: string;
}
