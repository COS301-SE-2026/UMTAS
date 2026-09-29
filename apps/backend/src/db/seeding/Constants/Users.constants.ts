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
  'janniebleekom@flyatup.com',
  'sarriejammergat@flyatup.com',
  'pietpierneef@flyatup.com',
  'kooskombuis@flyatup.com',
  'frikkiefrikkadel@flyatup.com',
  'bennieboerewors@flyatup.com',
  'hanneshandbriek@flyatup.com',
  'gerriegaskoeldrank@flyatup.com',
  'willemwindpomp@flyatup.com',
  'dawiedoringboom@flyatup.com',
  'faniefynbos@flyatup.com',
  'gertiegrasdak@flyatup.com',
  'riaanrookwolk@flyatup.com',
  'mariusmelktert@flyatup.com',
  'kobuskoffiepot@flyatup.com',
  'tienietjops@flyatup.com',
  'sanniesonstraal@flyatup.com',
  'annetjieappelkoos@flyatup.com',
  'marietjiemieliepap@flyatup.com',
  'lientjielemoen@flyatup.com',
  'karlakarringmelk@flyatup.com',
  'nellienartjie@flyatup.com',
  'betsieboontjie@flyatup.com',
  'tommietandem@flyatup.com',
  'wimpieworsrol@flyatup.com',
  'daniedroëwors@flyatup.com',
  'heiniehartsbees@flyatup.com',
  'rudierooibok@flyatup.com',
];

export const DEFAULT_COS_ADMIN_EMAIL = 'admin301@local.umtas';
export const DEFAULT_SYSTEM_ADMIN_EMAIL = 'system-admin@local.umtas';

export const getCosAdminEmail = (): string =>
  process.env.SEED_COS_ADMIN_EMAIL?.toLowerCase() ?? DEFAULT_COS_ADMIN_EMAIL;

export const getSystemAdminEmail = (): string =>
  process.env.SEED_SYSTEM_ADMIN_EMAIL ?? DEFAULT_SYSTEM_ADMIN_EMAIL;
