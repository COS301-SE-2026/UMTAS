export const UP_HATFIELD_SOURCES = [
  'https://www.up.ac.za/about-up/article/275604/campus-maps',
  'https://www.up.ac.za/department-of-computer-science',
] as const;

export interface UpHatfieldBuildingSeed {
  name: string;
  latitude: number;
  longitude: number;
}

export const UP_HATFIELD_BUILDINGS: readonly UpHatfieldBuildingSeed[] = [
  {
    name: 'Thuto Building',
    latitude: -25.752932877052245,
    longitude: 28.23145960192486,
  },
  {
    name: 'IT Building',
    latitude: -25.755334709611287,
    longitude: 28.232579768596462,
  },
  {
    name: 'Centenary/Eeufees Building',
    latitude: -25.75382056792293,
    longitude: 28.233478481562628,
  },
  {
    name: 'Engineering 1 Building',
    latitude: -25.752032648778318,
    longitude: 28.22904682574297,
  },
  {
    name: 'Chancellors Building',
    latitude: -25.754243030429393,
    longitude: 28.23051010413832,
  },
  {
    name: 'Merensky Library',
    latitude: -25.755122709513454,
    longitude: 28.23046714644736,
  },
  {
    name: 'Humanities Building',
    latitude: -25.75535702140905,
    longitude: 28.231503793202357,
  },
  {
    name: 'Aula',
    latitude: -25.754344,
    longitude: 28.229694,
  },
  {
    name: 'Natural Sciences 1 Building',
    latitude: -25.754756,
    longitude: 28.232087,
  },
  {
    name: 'Chemistry Building',
    latitude: -25.754314,
    longitude: 28.232989,
  },
  {
    name: 'Agricultural Sciences Building',
    latitude: -25.756267,
    longitude: 28.229734,
  },
  {
    name: 'Botany and Zoology Building',
    latitude: -25.757031,
    longitude: 28.231225,
  },
  {
    name: 'Admin Building',
    latitude: -25.75358,
    longitude: 28.229968,
  },
  {
    name: 'Musaion',
    latitude: -25.754064,
    longitude: 28.23028,
  },
  {
    name: 'Old Merensky Building',
    latitude: -25.75565,
    longitude: 28.230175,
  },
] as const;
