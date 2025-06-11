// components/seedYieldData.ts
export const seedYieldData: {
    location: string;
    values: number[];
  }[] = [
    { location: 'LN',  values: [205, 208, 210, 212, 210] },    // Shenyang
    { location: 'JL',  values: [218, 220, 222, 224, 221] },    // Gongzhuling
    { location: 'SX',  values: [228, 230, 231, 229, 232] },    // Fenyang
    { location: 'SD',  values: [222, 224, 226, 227, 225] },    // Jinan
    { location: 'NM',  values: [170, 172, 173, 174] },         // Zhalantun (lowest h)
    { location: 'HB',  values: [188, 190, 192, 191] },         // Shijiazhuang (ef)
    { location: 'GS',  values: [252, 254, 256, 258, 259] },    // Lanzhou (a)
    { location: 'XJ',  values: [263, 265, 266, 268] },         // Shihezi (highest a)
    { location: 'JX',  values: [192, 195, 198, 200, 197] },    // Nanchang (e)
    { location: 'MDJ', values: [202, 205, 207, 209, 206] },    // Mudanjiang (d)
    { location: 'JS',  values: [175, 176, 177, 178] },         // Xuzhou (gh)
    { location: 'DQ',  values: [180, 182, 183, 184] },         // Daqing (fg)
    { location: 'HLJ', values: [198, 200, 202, 203] },         // Harbin (e)
  ];
  