export type Carrier = "Liberty Express" | "Zoom" | "Tealca";

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
  // LIBERTY EXPRESS
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
    state: "Miranda",
    city: "Guarenas",
    officeName: "Buenaventura",
    fullAddress: "Centro Comercial Buenaventura, Nivel Planta Baja, Guarenas",
    postalCode: "1220",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Liberty+Express+Buenaventura+Guarenas"
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

  // ZOOM
  {
    carrier: "Zoom",
    state: "Distrito Capital",
    city: "Caracas",
    officeName: "La Urbina",
    fullAddress: "Av. Principal de La Urbina, Edificio Zoom, Caracas",
    postalCode: "1073",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Zoom+La+Urbina+Caracas"
  },
  {
    carrier: "Zoom",
    state: "Miranda",
    city: "Guarenas",
    officeName: "Guarenas Centro",
    fullAddress: "Calle Comercio, Edificio Don Bosco, Planta Baja, Guarenas",
    postalCode: "1220",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Zoom+Guarenas+Centro"
  },
  {
    carrier: "Zoom",
    state: "Zulia",
    city: "Maracaibo",
    officeName: "Delicias",
    fullAddress: "Av. 15 Delicias con Calle 78, Maracaibo",
    postalCode: "4001",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Zoom+Delicias+Maracaibo"
  },

  // TEALCA
  {
    carrier: "Tealca",
    state: "Distrito Capital",
    city: "Caracas",
    officeName: "Sabanagrande",
    fullAddress: "Av. Casanova, Sabana Grande, Caracas",
    postalCode: "1050",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Tealca+Sabana+Grande+Caracas"
  },
  {
    carrier: "Tealca",
    state: "Miranda",
    city: "Los Teques",
    officeName: "Centro Los Teques",
    fullAddress: "Av. La Hoyada, Centro Comercial La Hoyada, Los Teques",
    postalCode: "1201",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Tealca+Los+Teques"
  },
  {
    carrier: "Tealca",
    state: "Zulia",
    city: "Maracaibo",
    officeName: "Bella Vista",
    fullAddress: "Av. 4 Bella Vista, Sector La Lago, Maracaibo",
    postalCode: "4002",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Tealca+Bella+Vista+Maracaibo"
  }
];

export const getUniqueStates = () => {
  return Array.from(new Set(logisticsData.map(o => o.state))).sort();
};

export const getCitiesByState = (state: string) => {
  return Array.from(new Set(logisticsData.filter(o => o.state === state).map(o => o.city))).sort();
};
