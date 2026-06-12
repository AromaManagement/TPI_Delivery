export type Rol = "ADMIN" | "CLIENTE" | "COCINERO" | "REPARTIDOR";

export interface Usuario {
  id: number;
  correo: string;
  nombre: string;
  apellido: string;
  tipoDocumento?: string | null;
  documento?: string | null;
  telefono?: string | null;
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

export type EstadoComanda =
  | "SIN_ASIGNAR"
  | "EN_COCINA"
  | "LISTO"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

export interface Direccion {
  id: number;
  barrio?: string | null;
  calle?: string | null;
  manzanaPiso?: string | null;
  numeracion?: string | null;
  referencia?: string | null;
  casaDepto?: string | null;
  lat?: number | null;
  lng?: number | null;
  etiqueta?: string | null;
}

export interface CreateDireccionInput {
  calle?: string | null;
  numeracion?: string | null;
  barrio?: string | null;
  manzanaPiso?: string | null;
  casaDepto?: string | null;
  referencia?: string | null;
  lat?: number | null;
  lng?: number | null;
  etiqueta?: string | null;
}

export interface Comanda {
  id: number;
  clienteId?: number | null;
  estadoComanda?: EstadoComanda | null;
  fechaSolicitud: string;
  fechaEntrega?: string | null;
  detalles?: DetalleComanda[];
  direccion?: Direccion | null;
  repartidor?: Usuario | null;
  cliente?: Pick<Usuario, "id" | "nombre" | "apellido" | "telefono"> | null;
  createdAt?: string;
  updatedAt?: string;
  pago?: {
    estadoPago: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "CANCELADO";
    urlPago?: string;
  } | null;
}

export interface DetalleComanda {
  id: number;
  comandaId: number;
  empleadoId?: number | null;
  platoId: number;
  plato?: Plato;
  precioUnitario: number;
}
