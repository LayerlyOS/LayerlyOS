import type { FilamentItem, PrintEntry, Printer, Settings } from '@/types';

const DB_KEY = '3d_print_master_db_v7';
const SETTINGS_KEY = '3d_print_master_settings_v7';

export const seedData: PrintEntry[] = [
  {
    id: 1,
    date: '2024-05-20',
    name: 'Rose',
    timeH: 1,
    timeM: 0,
    weight: 24,
    brand: 'Rosa3D',
    color: 'Red',
    totalCost: 1.68,
    price: 5.0,
    profit: 66.45,
    qty: 20,
  },
];

export const filamentDatabase: FilamentItem[] = [
  // Devil Design
  { brand: 'Devil Design', type: 'PLA', color: 'Black', price: 65, weight: 1000 },
  { brand: 'Devil Design', type: 'PLA', color: 'White', price: 65, weight: 1000 },
  { brand: 'Devil Design', type: 'PLA', color: 'Red', price: 65, weight: 1000 },
  { brand: 'Devil Design', type: 'PLA', color: 'Blue', price: 65, weight: 1000 },
  { brand: 'Devil Design', type: 'PLA', color: 'Galaxy (Silk)', price: 85, weight: 1000 },
  { brand: 'Devil Design', type: 'PETG', color: 'Black', price: 69, weight: 1000 },
  { brand: 'Devil Design', type: 'PETG', color: 'Transparent', price: 69, weight: 1000 },
  { brand: 'Devil Design', type: 'ASA', color: 'Black', price: 95, weight: 1000 },
  { brand: 'Devil Design', type: 'TPU', color: 'Black', price: 110, weight: 1000 },

  // Rosa3D
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Black', price: 65, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'White', price: 65, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Navy Blue', price: 65, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Gray', price: 65, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Capri Blue Satin', price: 79, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Signal Violet', price: 69, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Violet Dynamic', price: 69, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Red Jasper Satin', price: 79, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Rose Beige Skin', price: 69, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter', color: 'Karmin Red', price: 69, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA High Speed', color: 'Rose Beige Skin', price: 19, weight: 1000 }, // Discounted example
  { brand: 'Rosa3D', type: 'PLA High Speed', color: 'Blue', price: 109, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Rainbow', color: 'Army Forest', price: 89, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Rainbow', color: 'Multicolour Silk Moon', price: 89, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Violet', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Sapphire', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Red Wine', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Navy Blue', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Karmin Red', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Emerald Green', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Brillant Silver', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Galaxy', color: 'Black', price: 95, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Pastel', color: 'Green', price: 35, weight: 800 }, // 0.35kg example adjusted
  { brand: 'Rosa3D', type: 'PLA Pastel', color: 'Pink', price: 35, weight: 800 },
  { brand: 'Rosa3D', type: 'PLA Pastel', color: 'Mint', price: 71, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Pastel', color: 'Peach', price: 71, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Pastel', color: 'Yellow', price: 35, weight: 800 },
  { brand: 'Rosa3D', type: 'PLA Pastel', color: 'Lavender', price: 35, weight: 800 },
  { brand: 'Rosa3D', type: 'PLA Pastel', color: 'Blue', price: 35, weight: 800 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Rose Gold', price: 99, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Navy Blue', price: 99, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Mistic Purple', price: 109, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Mistic Green', price: 109, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Gold-Silver', price: 109, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Frozen', price: 109, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Dragon Fruit', price: 109, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA-Silk', color: 'Mistic Tiger', price: 49, weight: 800 },
  { brand: 'Rosa3D', type: 'PLA Magic', color: 'Neon', price: 109, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA CarbonLook', color: 'Black', price: 119, weight: 1000 },
  { brand: 'Rosa3D', type: 'PLA Starter Glow in the Dark', color: 'Blue', price: 85, weight: 800 },
  { brand: 'Rosa3D', type: 'PETG Standard HS', color: 'Inox', price: 89, weight: 1000 },
  { brand: 'Rosa3D', type: 'PETG CarbonLook', color: 'Black', price: 129, weight: 1000 },
  { brand: 'Rosa3D', type: 'PETG V0 FR', color: 'Black', price: 299, weight: 1000 },
  { brand: 'Rosa3D', type: 'PETG + CF', color: 'Black', price: 139, weight: 800 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'Black', price: 84, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'Yellow', price: 72, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'White', price: 72, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'Red', price: 72, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'Juicy Orange', price: 72, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'Gray', price: 72, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'Dark Blue', price: 72, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS+', color: 'Green', price: 72, weight: 1000 },
  { brand: 'Rosa3D', type: 'ABS V0 FR', color: 'Black', price: 149, weight: 800 },
  { brand: 'Rosa3D', type: 'ABS V0 FR', color: 'White', price: 149, weight: 800 },
  { brand: 'Rosa3D', type: 'ASA', color: 'Grey', price: 73, weight: 800 },
  { brand: 'Rosa3D', type: 'PVA', color: 'Natural', price: 132, weight: 800 },
  { brand: 'Rosa3D', type: 'PVB', color: 'Black', price: 132, weight: 800 },
  { brand: 'Rosa3D', type: 'Flex 85A', color: 'Black', price: 109, weight: 800 },
  { brand: 'Rosa3D', type: 'Flex 96A', color: 'Ivory', price: 109, weight: 800 },
  { brand: 'Rosa3D', type: 'Flex 96A', color: 'Red', price: 160, weight: 1000 },
  { brand: 'Rosa3D', type: 'PC+PTFE', color: 'White', price: 271, weight: 800 },
  { brand: 'Rosa3D', type: 'PC-PBT', color: 'Black', price: 89, weight: 800 },
  { brand: 'Rosa3D', type: 'PCTG+10CF', color: 'Black', price: 79, weight: 800 },
  { brand: 'Rosa3D', type: 'PCTG+10GF', color: 'Black', price: 79, weight: 800 },
  { brand: 'Rosa3D', type: 'BioWOOD', color: 'Standard', price: 138, weight: 1000 },
  { brand: 'Rosa3D', type: 'BioWOOD', color: 'Black Oak', price: 129, weight: 1000 },
  { brand: 'Rosa3D', type: 'BioCREATE HT', color: 'Black', price: 139, weight: 1000 },
  { brand: 'Rosa3D', type: 'BioCREATE HT', color: 'White', price: 139, weight: 1000 },
  { brand: 'Rosa3D', type: 'BioCREATE HT', color: 'Reseda Green', price: 139, weight: 1000 },
  { brand: 'Rosa3D', type: 'BioCREATE HT', color: 'Light Gray', price: 139, weight: 1000 },
  { brand: 'Rosa3D', type: 'BioCREATE HT', color: 'Lavender', price: 139, weight: 1000 },
  { brand: 'Rosa3D', type: 'BioCREATE HT', color: 'Coral', price: 139, weight: 1000 },
  { brand: 'Rosa3D', type: 'R-PLA', color: 'Black', price: 34, weight: 1000 },
  { brand: 'Rosa3D', type: 'R-PET-G', color: 'Black', price: 34, weight: 1000 },
  { brand: 'Rosa3D', type: 'R-PET-G', color: 'Impact Black', price: 74, weight: 1000 },
  { brand: 'Rosa3D', type: 'R-PET-G', color: 'Impact White', price: 74, weight: 1000 },
  { brand: 'Rosa3D', type: 'R-PCTG', color: 'Black', price: 59, weight: 1000 },
  { brand: 'Rosa3D', type: 'R-ABS', color: 'Unspecified', price: 69, weight: 1000 },

  // Fiberlogy
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Black', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'White', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Graphite', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Inox', price: 118, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Ruby Red', price: 104, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Navy Blue', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Light Green', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Vertigo', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Beige', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Brown', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Orange', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Yellow', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Purple', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Pink', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Cyan', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Magenta', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Pastel Pink', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Pastel Blue', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Neon Green', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PLA', color: 'Glitter Silver', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'Impact PLA', color: 'Army Green', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'Impact PLA', color: 'Olive Green', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'Impact PLA', color: 'Khaki', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'Matte PLA', color: 'Black', price: 120, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberSilk', color: 'Metallics', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberSatin', color: 'Pearl', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberSatin', color: 'Black', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberSatin', color: 'Red', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberSatin', color: 'Blue', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberSatin', color: 'Green', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberSatin', color: 'Pink', price: 110, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PETG', color: 'Black', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PETG', color: 'White', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PETG', color: 'Pure Transparent', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy PETG', color: 'Burgundy Transparent', price: 105, weight: 850 },
  { brand: 'Fiberlogy', type: 'Matte PETG', color: 'Black', price: 123, weight: 850 },
  { brand: 'Fiberlogy', type: 'Refill Easy PETG', color: 'Black', price: 97, weight: 850 },
  { brand: 'Fiberlogy', type: 'PETG ESD', color: 'Black', price: 269, weight: 500 },
  { brand: 'Fiberlogy', type: 'PETG+PTFE', color: 'Natural', price: 169, weight: 750 },
  { brand: 'Fiberlogy', type: 'ABS PLUS', color: 'Blue', price: 115, weight: 850 },
  { brand: 'Fiberlogy', type: 'Easy ABS', color: 'Pure Transparent', price: 105, weight: 750 },
  { brand: 'Fiberlogy', type: 'Matte ASA', color: 'Black', price: 153, weight: 750 },
  { brand: 'Fiberlogy', type: 'FiberFlex 40D', color: 'Black', price: 217, weight: 850 },
  { brand: 'Fiberlogy', type: 'MattFlex 40D', color: 'Black', price: 260, weight: 850 },
  { brand: 'Fiberlogy', type: 'FiberFlex CF', color: 'Black', price: 204, weight: 500 },
  { brand: 'Fiberlogy', type: 'Nylon PA12', color: 'Natural', price: 221, weight: 750 },
  { brand: 'Fiberlogy', type: 'Nylon PA12', color: 'Black', price: 247, weight: 750 },
  { brand: 'Fiberlogy', type: 'PA12 + CF15', color: 'Black', price: 260, weight: 500 },
  { brand: 'Fiberlogy', type: 'PA12 + GF15', color: 'Black', price: 269, weight: 500 },
  { brand: 'Fiberlogy', type: 'PP', color: 'White', price: 175, weight: 750 },
  { brand: 'Fiberlogy', type: 'PP', color: 'Black', price: 175, weight: 750 },
  { brand: 'Fiberlogy', type: 'PP', color: 'Blue', price: 175, weight: 750 },
  { brand: 'Fiberlogy', type: 'PP', color: 'Natur', price: 175, weight: 750 },
  { brand: 'Fiberlogy', type: 'R PP', color: 'Anthracite', price: 132, weight: 750 },
  { brand: 'Fiberlogy', type: 'PCTG', color: 'Black', price: 127, weight: 750 },
  { brand: 'Fiberlogy', type: 'PCTG', color: 'Pure Transparent', price: 127, weight: 750 },
  { brand: 'Fiberlogy', type: 'PCTG + CF', color: 'Black', price: 225, weight: 750 },
  { brand: 'Fiberlogy', type: 'PC/ABS', color: 'Black', price: 136, weight: 750 },
  { brand: 'Fiberlogy', type: 'CPE ANTIBAC', color: 'Natural', price: 225, weight: 500 },
  { brand: 'Fiberlogy', type: 'R PLA', color: 'Anthracite', price: 90, weight: 850 },

  // Prusament
  { brand: 'Prusament', type: 'PLA', color: 'Galaxy Black', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Prusa Orange', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Noctua Beige', price: 140, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Noctua Brown', price: 140, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Pistachio Green', price: 145, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Galaxy Green', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Pristine White', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Anniversary LE 2025', price: 160, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Radiant Sky LE 2024', price: 170, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Super Galaxy LE 2023', price: 160, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Gravity Grey Hex', price: 145, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Army Green', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PLA', color: 'Galaxy Purple', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Jet Black', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Prusa Orange', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Neon Green', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Prusa Pro Green', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Sky Blue', price: 145, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Anthracite Grey', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Urban Grey', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Chalky Blue', price: 145, weight: 1000 },
  {
    brand: 'Prusament',
    type: 'PETG',
    color: 'Golden Glitter Yellow Gold',
    price: 145,
    weight: 1000,
  },
  { brand: 'Prusament', type: 'PETG', color: 'Jungle Green', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Lipstick Red', price: 145, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Mango Yellow', price: 145, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Galaxy Black', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Carmine Red Transparent', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG', color: 'Signal White', price: 150, weight: 1000 },
  { brand: 'Prusament', type: 'PETG CF', color: 'Black', price: 289, weight: 1000 },
  { brand: 'Prusament', type: 'PETG CF', color: 'Carbon Fiber Black', price: 299, weight: 1000 },
  { brand: 'Prusament', type: 'ASA', color: 'Galaxy Black', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Jet Black', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Natural', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Prusa Orange', price: 145, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Signal White', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Sapphire Blue', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Lipstick Red', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Prusa Pro Green', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Olive Green', price: 155, weight: 850 },
  { brand: 'Prusament', type: 'ASA', color: 'Red', price: 160, weight: 850 },
  { brand: 'Prusament', type: 'PC Blend', color: 'Orange', price: 277, weight: 970 },
  { brand: 'Prusament', type: 'PC Blend', color: 'Urban Grey', price: 277, weight: 970 },
  { brand: 'Prusament', type: 'PC Blend CF', color: 'Black', price: 363, weight: 800 },
  { brand: 'Prusament', type: 'PVB', color: 'Granatowy', price: 215, weight: 500 },
  { brand: 'Prusament', type: 'PA11CF', color: 'Black', price: 535, weight: 800 },

  // Bambu Lab
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Black', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'White', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Red', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Orange', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Beige', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Bambu Green', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Jade White', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Silver', price: 105, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Bright Green', price: 105, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Black', price: 105, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Ocean to Meadow', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Gold', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Mistletoe Green', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Purple', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Magenta', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Hot Pink', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Maroon Red', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Sunflower Yellow', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Pumpkin Orange', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Turquoise', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Cobalt Blue', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Indigo Purple', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Brown', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Pink', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Blue Grey', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Cyan', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Basic', color: 'Blue', price: 105, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Charcoal', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Ash Grey', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Ivory White', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Lemon Yellow', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Scarlet Red', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Dark Blue', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Ice Blue', price: 115, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Mandarin Orange', price: 93, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA Matte', color: 'Marine Blue', price: 138, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PETG Basic', color: 'Black', price: 109, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PETG-CF', color: 'Black', price: 175, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PETG-CF', color: 'Violet Purple', price: 166, weight: 1000 },
  { brand: 'Bambu Lab', type: 'ABS', color: 'Black', price: 91, weight: 1000 },
  { brand: 'Bambu Lab', type: 'ABS', color: 'White', price: 80, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PLA-CF', color: 'Black', price: 174, weight: 1000 },
  { brand: 'Bambu Lab', type: 'PC', color: 'Transparent', price: 199, weight: 1000 },

  // Sunlu
  { brand: 'Sunlu', type: 'PLA+', color: 'Black', price: 49, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'White', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Gray', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Red', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Blue', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Green', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Yellow', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Orange', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Fioletowy', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA+', color: 'Pink', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA', color: 'Magenta', price: 52, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA', color: 'Transparent', price: 45, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA', color: 'Fluorescent Yellow', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Matte', color: 'Clay', price: 45, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Matte', color: 'Grey', price: 50, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Meta', color: 'Green', price: 54, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Meta', color: 'Mint Green', price: 54, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Meta', color: 'Apple Green', price: 54, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Meta', color: 'Lavender Purple', price: 54, weight: 1000 },
  { brand: 'Sunlu', type: 'PETG', color: 'Black', price: 59, weight: 1000 },
  { brand: 'Sunlu', type: 'PETG', color: 'White', price: 59, weight: 1000 },
  { brand: 'Sunlu', type: 'PETG', color: 'Grey', price: 59, weight: 1000 },
  { brand: 'Sunlu', type: 'PETG', color: 'Transparent Orange', price: 60, weight: 1000 },
  { brand: 'Sunlu', type: 'PETG', color: 'Elite Green', price: 60, weight: 1000 },
  { brand: 'Sunlu', type: 'PETG', color: 'Elite Lavender Purple', price: 60, weight: 1000 },
  { brand: 'Sunlu', type: 'ABS', color: 'Black', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'ABS', color: 'White', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'ABS', color: 'Green', price: 55, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Silk', color: 'Silk Red', price: 60, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Silk', color: 'Silk Blue', price: 60, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Wood', color: 'Natural', price: 65, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Glow in the Dark', color: 'Greenish', price: 65, weight: 1000 },
  { brand: 'Sunlu', type: 'PLA Rainbow', color: 'Multi', price: 60, weight: 1000 },
];

export const defaultSettings: Settings = {
  power: 200,
  energyRate: 1.09,
  spoolPrice: 69.9,
  spoolWeight: 1000,
  printers: [
    {
      id: '1',
      name: 'Bambu A1',
      model: 'Bambu Lab A1',
      power: 140,
      costPerHour: 0,
      purchaseDate: '',
      notes: 'Compact Bambu printer',
    },
  ],
  defaultPrinterId: '1',
};

export const getStorageData = (): PrintEntry[] => {
  if (typeof window === 'undefined') return seedData;
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : seedData;
};

export const saveStorageData = (data: PrintEntry[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }
};

export const getSettings = (): Settings => {
  if (typeof window === 'undefined') return defaultSettings;
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : defaultSettings;
};

export const saveSettings = (settings: Settings): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};

// Printer management functions
export const getPrinters = (): Printer[] => {
  const settings = getSettings();
  const current = settings.printers;
  if (Array.isArray(current) && current.length > 0) {
    return current;
  }
  // Fallback to defaults when settings.printers is missing or empty
  const seeded = defaultSettings.printers || [];
  // Persist migration so future reads are stable
  if (typeof window !== 'undefined') {
    try {
      saveSettings({
        ...settings,
        printers: seeded,
        defaultPrinterId: settings.defaultPrinterId ?? defaultSettings.defaultPrinterId,
      });
    } catch {
      // no-op
    }
  }
  return seeded;
};

export const addPrinter = (printer: Omit<Printer, 'id'>): void => {
  const settings = getSettings();
  const printers = settings.printers || [];
  const maxId =
    printers.length > 0
      ? Math.max(
          ...printers.map((p) => {
            const numericId = Number((p as any).id);
            return Number.isFinite(numericId) ? numericId : 0;
          })
        )
      : 0;
  const newPrinter: Printer = {
    ...printer,
    id: String(maxId + 1),
  };
  printers.push(newPrinter);
  saveSettings({ ...settings, printers });
};

export const updatePrinter = (id: string | number, updates: Partial<Printer>): void => {
  const settings = getSettings();
  const printers = (settings.printers || []).map((p) =>
    String(p.id) === String(id) ? { ...p, ...updates } : p
  );
  saveSettings({ ...settings, printers });
};

export const deletePrinter = (id: string | number): void => {
  const settings = getSettings();
  const printers = (settings.printers || []).filter((p) => String(p.id) !== String(id));
  const defaultPrinterId =
    settings.defaultPrinterId && String(settings.defaultPrinterId) === String(id)
      ? printers[0]?.id
      : settings.defaultPrinterId;
  saveSettings({ ...settings, printers, defaultPrinterId });
};

export const getPrinterById = (id?: string | number): Printer | null => {
  const printers = getPrinters();
  const printerId = id ?? defaultSettings.defaultPrinterId;
  return printers.find((p) => String(p.id) === String(printerId)) || printers[0] || null;
};
