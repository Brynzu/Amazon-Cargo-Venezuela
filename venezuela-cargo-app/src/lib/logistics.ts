export type Carrier = "Liberty Express";

export interface CourierOffice {
  carrier: Carrier;
  state: string;
  city: string;
  officeName: string;
  fullAddress: string;
  postalCode: string;
  mapUrl: string;
}

export const logisticsData: CourierOffice[] = [
  {
    carrier: "Liberty Express",
    state: "Miranda",
    city: "San Antonio de Los Altos",
    officeName: "C.C. Los Altos",
    fullAddress: "Centro Comercial Los Altos, Planta Baja, San Antonio de Los Altos",
    postalCode: "1204",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Centro+Comercial+Los+Altos+San+Antonio"
  },
  {
    carrier: "Liberty Express",
    state: "Miranda",
    city: "Guarenas",
    officeName: "Buenaventura",
    fullAddress: "Centro Comercial Buenaventura, Nivel Planta Baja, Guarenas",
    postalCode: "1220",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Buenaventura+Guarenas"
  },
  {
    carrier: "Liberty Express",
    state: "Distrito Capital",
    city: "Caracas",
    officeName: "Chacao",
    fullAddress: "Av. Francisco de Miranda, Edificio Liberty, Planta Baja, Chacao, Caracas",
    postalCode: "1060",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Chacao+Caracas"
  },
  {
    carrier: "Liberty Express",
    state: "Distrito Capital",
    city: "Caracas",
    officeName: "La Candelaria",
    fullAddress: "Esq. Peligro a Puente República, Edif. Centro Villasmil, PB, La Candelaria",
    postalCode: "1010",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+La+Candelaria+Caracas"
  },
  {
    carrier: "Liberty Express",
    state: "Aragua",
    city: "Maracay",
    officeName: "Las Delicias",
    fullAddress: "Av. Las Delicias, Centro Comercial Locatel, Planta Baja",
    postalCode: "2102",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Las+Delicias+Maracay"
  },
  {
    carrier: "Liberty Express",
    state: "Carabobo",
    city: "Valencia",
    officeName: "El Trigal",
    fullAddress: "Av. Mañongo, C.C. Patio Trigal",
    postalCode: "2001",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+El+Trigal+Valencia"
  },
  {
    carrier: "Liberty Express",
    state: "Lara",
    city: "Barquisimeto",
    officeName: "Este",
    fullAddress: "Av. Los Leones, Centro Empresarial",
    postalCode: "3001",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Los+Leones+Barquisimeto"
  },
  {
    carrier: "Liberty Express",
    state: "Zulia",
    city: "Maracaibo",
    officeName: "5 de Julio",
    fullAddress: "Av. 5 de Julio, entre Av. 10 y 11, Maracaibo",
    postalCode: "4002",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+5+de+Julio+Maracaibo"
  },
  {
    carrier: "Liberty Express",
    state: "Anzoátegui",
    city: "Lechería",
    officeName: "Principal",
    fullAddress: "Av. Principal de Lechería, Centro Comercial",
    postalCode: "6016",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Lecheria"
  },
  {
    carrier: "Liberty Express",
    state: "Bolívar",
    city: "Puerto Ordaz",
    officeName: "Alta Vista",
    fullAddress: "Carrera Guri, Sector Alta Vista Sur",
    postalCode: "8050",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Alta+Vista+Puerto+Ordaz"
  },
  {
    carrier: "Liberty Express",
    state: "Monagas",
    city: "Maturín",
    officeName: "Juanico",
    fullAddress: "Av. Alirio Ugarte Pelayo, C.C. Monagas Plaza",
    postalCode: "6201",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Maturin"
  },
  {
    carrier: "Liberty Express",
    state: "Nueva Esparta",
    city: "Porlamar",
    officeName: "Sigo",
    fullAddress: "Av. Juan Bautista Arismendi, C.C. Sigo",
    postalCode: "6301",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Porlamar"
  },
  {
    carrier: "Liberty Express",
    state: "Táchira",
    city: "San Cristóbal",
    officeName: "Barrio Obrero",
    fullAddress: "Carrera 22 con Calle 10, Barrio Obrero",
    postalCode: "5001",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+San+Cristobal"
  },
  {
    carrier: "Liberty Express",
    state: "Mérida",
    city: "Mérida",
    officeName: "Las Américas",
    fullAddress: "Av. Las Américas, C.C. Plaza Mayor",
    postalCode: "5101",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Merida"
  },
  {
    carrier: "Liberty Express",
    state: "Falcón",
    city: "Punto Fijo",
    officeName: "Sambil",
    fullAddress: "Av. Intercomunal Alí Primera, C.C. Sambil Paraguaná",
    postalCode: "4102",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Punto+Fijo"
  },
  {
    carrier: "Liberty Express",
    state: "Portuguesa",
    city: "Acarigua",
    officeName: "Centro",
    fullAddress: "Av. Libertador, Edificio Central",
    postalCode: "3301",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Acarigua"
  },
  {
    carrier: "Liberty Express",
    state: "Barinas",
    city: "Barinas",
    officeName: "Alto Barinas",
    fullAddress: "Av. Los Andes, C.C. Cima",
    postalCode: "5201",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Barinas"
  },
  {
    carrier: "Liberty Express",
    state: "Yaracuy",
    city: "San Felipe",
    officeName: "Independencia",
    fullAddress: "5ta Avenida con Calle 31",
    postalCode: "3201",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+San+Felipe"
  },
  {
    carrier: "Liberty Express",
    state: "La Guaira",
    city: "Maiquetía",
    officeName: "Centro",
    fullAddress: "Calle Los Baños, Centro Comercial Maiquetía Plaza",
    postalCode: "1160",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Maiquetia"
  }
];

export const getUniqueStates = () => {
  return Array.from(new Set(logisticsData.map(o => o.state))).sort();
};

export const getCitiesByState = (state: string) => {
  return Array.from(new Set(logisticsData.filter(o => o.state === state).map(o => o.city))).sort();
};
