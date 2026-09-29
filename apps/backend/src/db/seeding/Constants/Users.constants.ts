//Users

export const UserNames: string[] = [
  'Jannie Bloekom',
  'Sarrie Jammer Gat',
  'Piet Pierneef',

  'Koos Kombuis',
  'Frikkie Frikkadel',
  'Bennie Boerewors',
  'Hannes Handbriek',
  'Gerrie Gaskoeldrank',
  'Willem Windpomp',
  'Dawie Doringboom',
  'Fanie Fynbos',
  'Gertie Grasdak',
  'Riaan Rookwolk',
  'Marius Melktert',
  'Kobus Koffiepot',
  'Tienie Tjops',
  'Sannie Sonstraal',
  'Annetjie Appelkoos',
  'Marietjie Mieliepap',
  'Lientjie Lemoen',
  'Karla Karringmelk',
  'Nellie Nartjie',
  'Betsie Boontjie',
  'Tommie Tandem',
  'Wimpie Worsrol',
  'Danie Droëwors',
  'Heinie Hartsbees',
  'Rudie Rooibok',
];

export const UserEmails: string[] = [
  'JannieBloekom@FlyAtUP.com',
  'SarrieJammerGat@FlyAtUP.com',
  'PietPierneef@FlyAtUP.com',

  'KoosKombuis@FlyAtUP.com',
  'FrikkieFrikkadel@FlyAtUP.com',
  'BennieBoerewors@FlyAtUP.com',
  'HannesHandbriek@FlyAtUP.com',
  'GerrieGaskoeldrank@FlyAtUP.com',
  'WillemWindpomp@FlyAtUP.com',
  'DawieDoringboom@FlyAtUP.com',
  'FanieFynbos@FlyAtUP.com',
  'GertieGrasdak@FlyAtUP.com',
  'RiaanRookwolk@FlyAtUP.com',
  'MariusMelktert@FlyAtUP.com',
  'KobusKoffiepot@FlyAtUP.com',
  'TienieTjops@FlyAtUP.com',
  'SannieSonstraal@FlyAtUP.com',
  'AnnetjieAppelkoos@FlyAtUP.com',
  'MarietjieMieliepap@FlyAtUP.com',
  'LientjieLemoen@FlyAtUP.com',
  'KarlaKarringmelk@FlyAtUP.com',
  'NellieNartjie@FlyAtUP.com',
  'BetsieBoontjie@FlyAtUP.com',
  'TommieTandem@FlyAtUP.com',
  'WimpieWorsrol@FlyAtUP.com',
  'DanieDroëwors@FlyAtUP.com',
  'HeinieHartsbees@FlyAtUP.com',
  'RudieRooibok@FlyAtUP.com',
];

export const DEFAULT_COS_ADMIN_EMAIL = 'admin301@local.umtas';
export const DEFAULT_SYSTEM_ADMIN_EMAIL = 'system-admin@local.umtas';

export const getCosAdminEmail = (): string =>
  process.env.SEED_COS_ADMIN_EMAIL?.toLowerCase() ?? DEFAULT_COS_ADMIN_EMAIL;

export const getSystemAdminEmail = (): string =>
  process.env.SEED_SYSTEM_ADMIN_EMAIL ?? DEFAULT_SYSTEM_ADMIN_EMAIL;
