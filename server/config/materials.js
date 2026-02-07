const MATERIALS = {
  aluminum: {
    name: 'Aluminum Can',
    weight_kg: 0.014,
    carbon_per_kg: 9.13,
    water_per_kg: 40.0,
  },
  plastic: {
    name: 'Plastic Bottle',
    weight_kg: 0.0083,
    carbon_per_kg: 1.5,
    water_per_kg: 22.0,
  },
  glass: {
    name: 'Glass Bottle',
    weight_kg: 0.35,
    carbon_per_kg: 0.31,
    water_per_kg: 3.0,
  },
  paper: {
    name: 'Paper/Newspaper',
    weight_kg: 0.3,
    carbon_per_kg: 3.55,
    water_per_kg: 30.0,
  },
  steel: {
    name: 'Steel/Tin Can',
    weight_kg: 0.05,
    carbon_per_kg: 1.82,
    water_per_kg: 12.0,
  },
  cardboard: {
    name: 'Cardboard Box',
    weight_kg: 0.4,
    carbon_per_kg: 3.12,
    water_per_kg: 27.0,
  },
};

const VALID_MATERIALS = Object.keys(MATERIALS);

const EQUIVALENTS = {
  km_per_kg_co2: 5.5,
  kg_co2_per_tree: 22,
  liters_per_bathtub: 100,
};

module.exports = { MATERIALS, VALID_MATERIALS, EQUIVALENTS };
