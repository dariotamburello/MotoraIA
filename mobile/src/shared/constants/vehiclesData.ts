export type VehicleBodyType =
  | "sedan"
  | "hatchback"
  | "suv"
  | "pick-up"
  | "furgon"
  | "minivan"
  | "rural";

export interface VehicleModel {
  name: string;
  years: number[];
  bodyType: VehicleBodyType;
}

export interface VehicleBrand {
  name: string;
  models: VehicleModel[];
}

function makeYears(from: number, to: number = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let y = to; y >= from; y--) {
    years.push(y);
  }
  return years;
}

export const VEHICLE_BRANDS: VehicleBrand[] = [
  {
    name: "Fiat",
    models: [
      { name: "Cronos", years: makeYears(2018), bodyType: "sedan" },
      { name: "Pulse", years: makeYears(2021), bodyType: "suv" },
      { name: "Argo", years: makeYears(2017), bodyType: "hatchback" },
      { name: "Mobi", years: makeYears(2016), bodyType: "hatchback" },
      { name: "Toro", years: makeYears(2017), bodyType: "pick-up" },
      { name: "Fastback", years: makeYears(2022), bodyType: "suv" },
      { name: "500", years: makeYears(2008, 2022), bodyType: "hatchback" },
      { name: "Palio", years: makeYears(1997, 2018), bodyType: "hatchback" },
      { name: "Uno", years: makeYears(1983, 2014), bodyType: "hatchback" },
      { name: "Siena", years: makeYears(1998, 2016), bodyType: "sedan" },
      { name: "Ducato", years: makeYears(2010), bodyType: "furgon" },
    ],
  },
  {
    name: "Renault",
    models: [
      { name: "Kwid", years: makeYears(2017), bodyType: "hatchback" },
      { name: "Sandero", years: makeYears(2008), bodyType: "hatchback" },
      { name: "Logan", years: makeYears(2007), bodyType: "sedan" },
      { name: "Duster", years: makeYears(2012), bodyType: "suv" },
      { name: "Captur", years: makeYears(2017), bodyType: "suv" },
      { name: "Kangoo", years: makeYears(2008), bodyType: "furgon" },
      { name: "Oroch", years: makeYears(2016), bodyType: "pick-up" },
      { name: "Koleos", years: makeYears(2018), bodyType: "suv" },
      { name: "Clio", years: makeYears(2000, 2021), bodyType: "hatchback" },
      { name: "Fluence", years: makeYears(2011, 2019), bodyType: "sedan" },
    ],
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Polo", years: makeYears(2018), bodyType: "hatchback" },
      { name: "Virtus", years: makeYears(2018), bodyType: "sedan" },
      { name: "T-Cross", years: makeYears(2020), bodyType: "suv" },
      { name: "Amarok", years: makeYears(2010), bodyType: "pick-up" },
      { name: "Vento", years: makeYears(2021), bodyType: "sedan" },
      { name: "Nivus", years: makeYears(2021), bodyType: "suv" },
      { name: "Taos", years: makeYears(2022), bodyType: "suv" },
      { name: "Golf", years: makeYears(2013, 2021), bodyType: "hatchback" },
      { name: "Suran", years: makeYears(2006, 2020), bodyType: "rural" },
      { name: "Gol", years: makeYears(2000, 2021), bodyType: "hatchback" },
      { name: "Fox", years: makeYears(2004, 2018), bodyType: "hatchback" },
    ],
  },
  {
    name: "Chevrolet",
    models: [
      { name: "Onix", years: makeYears(2013), bodyType: "hatchback" },
      { name: "Tracker", years: makeYears(2013), bodyType: "suv" },
      { name: "S10", years: makeYears(2012), bodyType: "pick-up" },
      { name: "Montana", years: makeYears(2022), bodyType: "pick-up" },
      { name: "Cruze", years: makeYears(2012), bodyType: "sedan" },
      { name: "Spin", years: makeYears(2013, 2022), bodyType: "minivan" },
      { name: "Equinox", years: makeYears(2018), bodyType: "suv" },
      { name: "Trailblazer", years: makeYears(2018), bodyType: "suv" },
      { name: "Classic", years: makeYears(2002, 2016), bodyType: "sedan" },
    ],
  },
  {
    name: "Toyota",
    models: [
      { name: "Hilux", years: makeYears(2005), bodyType: "pick-up" },
      { name: "Corolla", years: makeYears(2003), bodyType: "sedan" },
      { name: "Yaris", years: makeYears(2018), bodyType: "hatchback" },
      { name: "SW4", years: makeYears(2006), bodyType: "suv" },
      { name: "RAV4", years: makeYears(2019), bodyType: "suv" },
      { name: "Fortuner", years: makeYears(2016), bodyType: "suv" },
      { name: "Land Cruiser Prado", years: makeYears(2010), bodyType: "suv" },
      { name: "GR Corolla", years: makeYears(2023), bodyType: "hatchback" },
      { name: "Etios", years: makeYears(2013, 2022), bodyType: "hatchback" },
    ],
  },
  {
    name: "Ford",
    models: [
      { name: "Ranger", years: makeYears(2006), bodyType: "pick-up" },
      { name: "Territory", years: makeYears(2021), bodyType: "suv" },
      { name: "Maverick", years: makeYears(2022), bodyType: "pick-up" },
      { name: "EcoSport", years: makeYears(2003, 2021), bodyType: "suv" },
      { name: "Ka", years: makeYears(2015, 2021), bodyType: "hatchback" },
      { name: "Focus", years: makeYears(2008, 2019), bodyType: "hatchback" },
      { name: "F-150", years: makeYears(2015), bodyType: "pick-up" },
      { name: "Bronco Sport", years: makeYears(2021), bodyType: "suv" },
    ],
  },
  {
    name: "Peugeot",
    models: [
      { name: "208", years: makeYears(2014), bodyType: "hatchback" },
      { name: "2008", years: makeYears(2014), bodyType: "suv" },
      { name: "3008", years: makeYears(2017), bodyType: "suv" },
      { name: "408", years: makeYears(2022), bodyType: "sedan" },
      { name: "5008", years: makeYears(2017), bodyType: "suv" },
      { name: "Partner", years: makeYears(2010), bodyType: "furgon" },
      { name: "307", years: makeYears(2002, 2014), bodyType: "hatchback" },
      { name: "308", years: makeYears(2012, 2021), bodyType: "hatchback" },
    ],
  },
  {
    name: "Citroën",
    models: [
      { name: "C3", years: makeYears(2017), bodyType: "hatchback" },
      { name: "C4", years: makeYears(2020), bodyType: "sedan" },
      { name: "C4 Cactus", years: makeYears(2015, 2023), bodyType: "suv" },
      { name: "C5 Aircross", years: makeYears(2019), bodyType: "suv" },
      { name: "Berlingo", years: makeYears(2010), bodyType: "furgon" },
      { name: "Jumper", years: makeYears(2010), bodyType: "furgon" },
      {
        name: "Xsara Picasso",
        years: makeYears(2001, 2014),
        bodyType: "minivan",
      },
    ],
  },
  {
    name: "Nissan",
    models: [
      { name: "Frontier", years: makeYears(2003), bodyType: "pick-up" },
      { name: "Kicks", years: makeYears(2017), bodyType: "suv" },
      { name: "Versa", years: makeYears(2012), bodyType: "sedan" },
      { name: "Sentra", years: makeYears(2021), bodyType: "sedan" },
      { name: "X-Trail", years: makeYears(2015), bodyType: "suv" },
      { name: "Pathfinder", years: makeYears(2013), bodyType: "suv" },
      { name: "March", years: makeYears(2011, 2020), bodyType: "hatchback" },
    ],
  },
  {
    name: "Jeep",
    models: [
      { name: "Renegade", years: makeYears(2015), bodyType: "suv" },
      { name: "Compass", years: makeYears(2017), bodyType: "suv" },
      { name: "Gladiator", years: makeYears(2021), bodyType: "pick-up" },
      { name: "Wrangler", years: makeYears(2008), bodyType: "suv" },
      { name: "Grand Cherokee", years: makeYears(2012), bodyType: "suv" },
      { name: "Commander", years: makeYears(2022), bodyType: "suv" },
    ],
  },
  {
    name: "Honda",
    models: [
      { name: "HR-V", years: makeYears(2016), bodyType: "suv" },
      { name: "Civic", years: makeYears(2006), bodyType: "sedan" },
      { name: "WR-V", years: makeYears(2017), bodyType: "suv" },
      { name: "CR-V", years: makeYears(2015), bodyType: "suv" },
      { name: "City", years: makeYears(2020), bodyType: "sedan" },
      { name: "Fit", years: makeYears(2009, 2020), bodyType: "hatchback" },
      { name: "Accord", years: makeYears(2013, 2022), bodyType: "sedan" },
    ],
  },
  {
    name: "Hyundai",
    models: [
      { name: "Creta", years: makeYears(2017), bodyType: "suv" },
      { name: "HB20", years: makeYears(2013), bodyType: "hatchback" },
      { name: "Tucson", years: makeYears(2016), bodyType: "suv" },
      { name: "Santa Fe", years: makeYears(2018), bodyType: "suv" },
      { name: "Venue", years: makeYears(2021), bodyType: "suv" },
      { name: "Elantra", years: makeYears(2020), bodyType: "sedan" },
      { name: "i30", years: makeYears(2012, 2022), bodyType: "hatchback" },
    ],
  },
  {
    name: "Kia",
    models: [
      { name: "Sportage", years: makeYears(2011), bodyType: "suv" },
      { name: "Seltos", years: makeYears(2020), bodyType: "suv" },
      { name: "Sonet", years: makeYears(2021), bodyType: "suv" },
      { name: "Stonic", years: makeYears(2020), bodyType: "suv" },
      { name: "Cerato", years: makeYears(2014, 2022), bodyType: "sedan" },
      { name: "Picanto", years: makeYears(2012, 2022), bodyType: "hatchback" },
      { name: "Rio", years: makeYears(2012, 2022), bodyType: "hatchback" },
    ],
  },
  {
    name: "Mercedes-Benz",
    models: [
      { name: "Clase A", years: makeYears(2018), bodyType: "hatchback" },
      { name: "Clase C", years: makeYears(2015), bodyType: "sedan" },
      { name: "Clase E", years: makeYears(2017), bodyType: "sedan" },
      { name: "GLA", years: makeYears(2015), bodyType: "suv" },
      { name: "GLC", years: makeYears(2016), bodyType: "suv" },
      { name: "GLE", years: makeYears(2019), bodyType: "suv" },
      { name: "Sprinter", years: makeYears(2010), bodyType: "furgon" },
    ],
  },
  {
    name: "BMW",
    models: [
      { name: "Serie 1", years: makeYears(2016), bodyType: "hatchback" },
      { name: "Serie 3", years: makeYears(2013), bodyType: "sedan" },
      { name: "Serie 5", years: makeYears(2017), bodyType: "sedan" },
      { name: "X1", years: makeYears(2016), bodyType: "suv" },
      { name: "X3", years: makeYears(2018), bodyType: "suv" },
      { name: "X5", years: makeYears(2019), bodyType: "suv" },
      { name: "X6", years: makeYears(2020), bodyType: "suv" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers para derivar opciones de selección
// ---------------------------------------------------------------------------

export function getBrandOptions(): { label: string; value: string }[] {
  return VEHICLE_BRANDS.map((b) => ({ label: b.name, value: b.name }));
}

export function getModelOptions(brandName: string): { label: string; value: string }[] {
  const brand = VEHICLE_BRANDS.find((b) => b.name === brandName);
  if (!brand) return [];
  return brand.models.map((m) => ({ label: m.name, value: m.name }));
}

export function getYearOptions(
  brandName: string,
  modelName: string,
): { label: string; value: string }[] {
  const brand = VEHICLE_BRANDS.find((b) => b.name === brandName);
  if (!brand) return [];
  const model = brand.models.find((m) => m.name === modelName);
  if (!model) return [];
  return model.years.map((y) => ({ label: String(y), value: String(y) }));
}

export function getBodyTypeForVehicle(
  brandName: string,
  modelName: string,
): VehicleBodyType | undefined {
  const brand = VEHICLE_BRANDS.find((b) => b.name === brandName);
  if (!brand) return undefined;
  const model = brand.models.find((m) => m.name === modelName);
  return model?.bodyType;
}
