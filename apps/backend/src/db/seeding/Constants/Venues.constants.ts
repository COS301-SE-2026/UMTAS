import { ActivityType } from 'shared-types';

type UpHatfieldVenueSeed = {
  name: string;
  buildingName: string;
  capacity?: number;
};

export const VENUES_BY_ACTIVITY: Partial<
  Record<ActivityType, readonly string[]>
> = {
  lecture: [
    'Aula Auditorium',
    'Musaion Auditorium',
    'IT 2-23',
    'Centenary 1',
    'Thuto 1-1',
    'HB 1-1',
  ],
  tutorial: [
    'IT 4-1',
    'IT 4-2',
    'Centenary 2',
    'Chancellors 1-1',
    'Seminar Room 1',
    'HB 2-1',
  ],
  prac: [
    'IT 2-24',
    'IT 2-25',
    'Chemistry Lab 1-24',
    'Chemistry Lab 1-40',
    'NAS I 1-1',
    'Botany Lab 1',
  ],
};

const AULA_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Aula Auditorium', buildingName: 'Aula', capacity: 1025 },
  { name: 'Musaion Auditorium', buildingName: 'Aula', capacity: 500 },
  { name: 'Rautenbach Hall', buildingName: 'Aula', capacity: 0 },
];
const AMPHITHEATER_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Amphitheatre Main', buildingName: 'Amphitheater', capacity: 3000 },
];
const EMS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'EMS Lecture Theatre',
    buildingName: 'Economic and Management Sciences (EMS) ',
    capacity: 0,
  },
  {
    name: 'EMS 1-1',
    buildingName: 'Economic and Management Sciences (EMS) ',
    capacity: 150,
  },
  {
    name: 'EMS 1-2',
    buildingName: 'Economic and Management Sciences (EMS) ',
    capacity: 150,
  },
  {
    name: 'EMS 2-1',
    buildingName: 'Economic and Management Sciences (EMS) ',
    capacity: 120,
  },
  {
    name: 'EMS 2-2',
    buildingName: 'Economic and Management Sciences (EMS) ',
    capacity: 120,
  },
];
const IT_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'IT 2-23', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 2-24', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 2-25', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 2-26', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 2-27', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 4-1', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 4-2', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 4-3', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 4-4', buildingName: 'IT ', capacity: 200 },
  { name: 'IT 4-5', buildingName: 'IT ', capacity: 200 },
];
const CENTENARY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Centenary 1', buildingName: 'Centenary ', capacity: 150 },
  { name: 'Centenary 2', buildingName: 'Centenary ', capacity: 150 },
  { name: 'Centenary 3', buildingName: 'Centenary ', capacity: 150 },
  { name: 'Centenary 4', buildingName: 'Centenary ', capacity: 150 },
  { name: 'Centenary 5', buildingName: 'Centenary ', capacity: 150 },
  { name: 'Centenary 6', buildingName: 'Centenary ', capacity: 150 },
];
const ENGINEERING_1_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Eng I 1-1', buildingName: 'Engineering 1 ', capacity: 0 },
  { name: 'Eng I 1-2', buildingName: 'Engineering 1 ', capacity: 0 },
  { name: 'Eng I 1-3', buildingName: 'Engineering 1 ', capacity: 0 },
  { name: 'Eng I 1-4', buildingName: 'Engineering 1 ', capacity: 0 },
];

const ENGINEERING_2_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Eng II 1-1', buildingName: 'Engineering 2 ', capacity: 200 },
  { name: 'Eng II 1-2', buildingName: 'Engineering 2 ', capacity: 200 },
  { name: 'Eng II 2-1', buildingName: 'Engineering 2 ', capacity: 150 },
];

const ENGINEERING_3_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Eng III 1-1', buildingName: 'Engineering 3 ', capacity: 150 },
  { name: 'Eng III 1-2', buildingName: 'Engineering 3 ', capacity: 150 },
];
const CHEMISTRY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Chemistry Lab 1-24', buildingName: 'Chemistry ', capacity: 0 },
  { name: 'Chemistry Lab 1-40', buildingName: 'Chemistry ', capacity: 0 },
  { name: 'Chemistry Lab 1-40 Ext', buildingName: 'Chemistry ', capacity: 0 },
  { name: 'Large Chemistry Hall', buildingName: 'Chemistry ', capacity: 0 },
];

const OLD_CHEMISTRY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Old Chemistry 1-1', buildingName: 'Old Chemistry ', capacity: 100 },
  { name: 'Old Chemistry Lab 1', buildingName: 'Old Chemistry ', capacity: 0 },
];
const THUTO_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Thuto 1-1', buildingName: 'Thuto ', capacity: 300 },
  { name: 'Thuto 1-2', buildingName: 'Thuto ', capacity: 300 },
  { name: 'Thuto 2-1', buildingName: 'Thuto ', capacity: 250 },
  { name: 'Thuto 2-2', buildingName: 'Thuto ', capacity: 250 },
];
const CHANCELLORS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Roos Hall', buildingName: 'Chancellors ', capacity: 0 },
  { name: 'Chancellors 1-1', buildingName: 'Chancellors ', capacity: 100 },
  { name: 'Chancellors 1-2', buildingName: 'Chancellors ', capacity: 100 },
  { name: 'Admin Boardroom 1', buildingName: 'Chancellors ', capacity: 40 },
  { name: 'Admin Boardroom 2', buildingName: 'Chancellors ', capacity: 40 },
  { name: 'Conference Hall 1', buildingName: 'Chancellors ', capacity: 200 },
  { name: 'Conference Hall 2', buildingName: 'Chancellors ', capacity: 100 },
];
const MERENSKY_LIBRARY_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Research Commons', buildingName: 'Merensky Library', capacity: 0 },
  { name: 'Learning Centre', buildingName: 'Merensky Library', capacity: 0 },
  { name: 'Seminar Room 1', buildingName: 'Merensky Library', capacity: 30 },
  { name: 'Seminar Room 2', buildingName: 'Merensky Library', capacity: 30 },
  { name: 'Old Merensky 1-1', buildingName: 'Merensky Library', capacity: 100 },
  { name: 'Old Merensky 1-2', buildingName: 'Merensky Library', capacity: 100 },
  {
    name: 'Graduate Centre Hall',
    buildingName: 'Merensky Library',
    capacity: 150,
  },
  {
    name: 'Graduate Centre Seminar Room',
    buildingName: 'Merensky Library',
    capacity: 40,
  },
];
const HUMANITIES_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'HB 1-1', buildingName: 'Humanities ', capacity: 250 },
  { name: 'HB 1-2', buildingName: 'Humanities ', capacity: 250 },
  { name: 'HB 2-1', buildingName: 'Humanities ', capacity: 200 },
  { name: 'HB 2-2', buildingName: 'Humanities ', capacity: 200 },
  { name: 'HB 3-1', buildingName: 'Humanities ', capacity: 150 },
  { name: 'Old Arts 1-1', buildingName: 'Humanities ', capacity: 150 },
  { name: 'Old Arts 1-2', buildingName: 'Humanities ', capacity: 150 },
  { name: 'Mapungubwe Gallery', buildingName: 'Humanities ', capacity: 0 },
  { name: 'Music Practice Room 1', buildingName: 'Humanities ', capacity: 0 },
  { name: 'Music Recital Hall', buildingName: 'Humanities ', capacity: 80 },
];
const HUMAN_SCIENCES_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Human Sciences 1-1', buildingName: 'Human Sciences', capacity: 200 },
  { name: 'Human Sciences 1-2', buildingName: 'Human Sciences', capacity: 200 },
  { name: 'Human Sciences 2-1', buildingName: 'Human Sciences', capacity: 150 },
];
const NATURAL_SCIENCES_1_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'NAS I 1-1', buildingName: 'Natural Sciences 1', capacity: 200 },
  { name: 'NAS I 1-2', buildingName: 'Natural Sciences 1', capacity: 200 },
  { name: 'NAS I 2-1', buildingName: 'Natural Sciences 1', capacity: 150 },
  { name: 'Geography 1-1', buildingName: 'Natural Sciences 1', capacity: 100 },
  { name: 'Geography 1-2', buildingName: 'Natural Sciences 1', capacity: 100 },
];
const NATURAL_SCIENCES_2_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'NAS II 1-1', buildingName: 'Natural Sciences 2', capacity: 200 },
  { name: 'NAS II 1-2', buildingName: 'Natural Sciences 2', capacity: 200 },
];
const NATURAL_AND_AGRICULTURAL_SCIENCES_VENUES: readonly UpHatfieldVenueSeed[] =
  [
    {
      name: 'Agric Sci 1-1',
      buildingName: 'Natural & Agricultural Sciences',
      capacity: 150,
    },
    {
      name: 'Agric Sci 1-2',
      buildingName: 'Natural & Agricultural Sciences',
      capacity: 150,
    },
    {
      name: 'Agric Sci 2-1',
      buildingName: 'Natural & Agricultural Sciences',
      capacity: 100,
    },
  ];

const PLANT_SCIENCE_COMPLEX_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Plant Science Auditorium',
    buildingName: 'Plant Science Complex',
    capacity: 0,
  },
  { name: 'Herbarium', buildingName: 'Plant Science Complex', capacity: 0 },
  { name: 'Phytotron', buildingName: 'Plant Science Complex', capacity: 0 },
  {
    name: 'Plant Science Lab 1',
    buildingName: 'Plant Science Complex',
    capacity: 0,
  },
  {
    name: 'Plant Science Conference Room',
    buildingName: 'Plant Science Complex',
    capacity: 20,
  },
];
const BOTNAY_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Botany 1-1', buildingName: 'Botnay', capacity: 120 },
  { name: 'Botany Lab 1', buildingName: 'Botnay', capacity: 0 },
];

const ZOOLOGY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Zoology Lab 1', buildingName: 'Zoology', capacity: 0 },
  { name: 'Zoology 1-1', buildingName: 'Zoology', capacity: 100 },
];
const MATHEMATICS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Maths 1-1', buildingName: 'Mathematics', capacity: 150 },
  { name: 'Maths 1-2', buildingName: 'Mathematics', capacity: 150 },
  { name: 'Maths 2-1', buildingName: 'Mathematics', capacity: 100 },
];
const LAW_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Moot Court', buildingName: 'Law', capacity: 0 },
  { name: 'Law 1-1', buildingName: 'Law', capacity: 150 },
  { name: 'Law 1-2', buildingName: 'Law', capacity: 150 },
];
const THEOLOGY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Theology 1-1', buildingName: 'Theology ', capacity: 100 },
  { name: 'Theology 1-2', buildingName: 'Theology ', capacity: 100 },
];
const DRAMA_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Masker Theatre', buildingName: 'Drama ', capacity: 0 },
  { name: 'Lier Theatre', buildingName: 'Drama ', capacity: 0 },
  { name: 'Drama 1-1', buildingName: 'Drama ', capacity: 60 },
];
const VISUAL_ARTS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Visual Arts Studio 1', buildingName: 'Visual Arts', capacity: 0 },
  { name: 'Visual Arts Studio 2', buildingName: 'Visual Arts', capacity: 0 },
  {
    name: 'Visual Arts Lecture Hall',
    buildingName: 'Visual Arts',
    capacity: 100,
  },
];
const JAVETT_MUSEUM_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Javett Auditorium', buildingName: 'Javett Museum', capacity: 0 },
  { name: 'Javett Gallery 1', buildingName: 'Javett Museum', capacity: 0 },
];
const STUDENT_CENTER_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Student Centre Hall',
    buildingName: 'Student Center',
    capacity: 200,
  },
  {
    name: 'Student Centre Meeting Room 1',
    buildingName: 'Student Center',
    capacity: 40,
  },
];
const SCI_ENZA_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Sci-Enza Exhibit Hall', buildingName: 'Sci-Enza', capacity: 0 },
  { name: 'Sci-Enza Workshop Room', buildingName: 'Sci-Enza', capacity: 40 },
];
const BOUKUNDE_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Building Sciences 1-1', buildingName: 'Boukunde', capacity: 150 },
  { name: 'Building Sciences 1-2', buildingName: 'Boukunde', capacity: 150 },
  { name: 'CEFIM 1-1', buildingName: 'Boukunde', capacity: 80 },
  { name: 'CEFIM 1-2', buildingName: 'Boukunde', capacity: 80 },
];
const MINING_SCIENCE_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Mineral Sciences 1-1',
    buildingName: 'Mining Science',
    capacity: 100,
  },
  {
    name: 'Mineral Sciences Lab 1',
    buildingName: 'Mining Science',
    capacity: 0,
  },
];

const A_E_DU_TOIT_AUDITORIUM_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'AE du Toit Lecture Hall 1',
    buildingName: 'A E Du Toit Auditorium',
    capacity: 0,
  },
  {
    name: 'AE du Toit Lecture Hall 2',
    buildingName: 'A E Du Toit Auditorium',
    capacity: 0,
  },
  {
    name: 'Van der Graaf Lab',
    buildingName: 'A E Du Toit Auditorium',
    capacity: 0,
  },
];
const AIM_IT_LABS_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'AIM IT Lab 1', buildingName: 'AIM IT Labs', capacity: 60 },
  { name: 'AIM IT Lab 2', buildingName: 'AIM IT Labs', capacity: 60 },
];

const AUXILIARY_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Steers', buildingName: 'Steers', capacity: 0 },
  {
    name: 'Artisan Coffee Bar',
    buildingName: 'Artisan Coffee Bar',
    capacity: 0,
  },
  { name: 'Club Hall', buildingName: 'Club Hall', capacity: 100 },
  { name: 'Haloa Coffee', buildingName: 'Haloa Coffee', capacity: 0 },
  { name: 'Adlers Restaurant', buildingName: 'Adlers Restaurant', capacity: 0 },
  { name: 'Tenz Express', buildingName: 'Tenz Express', capacity: 0 },
  { name: 'Vida E Cafe', buildingName: 'Vida E Cafe', capacity: 0 },
  { name: 'Piazza', buildingName: 'Piazza', capacity: 0 },
  { name: 'Cozy Coffee', buildingName: 'Cozy Coffee', capacity: 0 },
];

// Combined
export const UP_HATFIELD_VENUES: readonly UpHatfieldVenueSeed[] = [
  ...AULA_VENUES,
  ...AMPHITHEATER_VENUES,
  ...EMS_BUILDING_VENUES,
  ...IT_BUILDING_VENUES,
  ...CENTENARY_BUILDING_VENUES,
  ...ENGINEERING_1_BUILDING_VENUES,
  ...ENGINEERING_2_BUILDING_VENUES,
  ...ENGINEERING_3_BUILDING_VENUES,
  ...CHEMISTRY_BUILDING_VENUES,
  ...OLD_CHEMISTRY_BUILDING_VENUES,
  ...THUTO_BUILDING_VENUES,
  ...CHANCELLORS_BUILDING_VENUES,
  ...MERENSKY_LIBRARY_VENUES,
  ...HUMANITIES_BUILDING_VENUES,
  ...HUMAN_SCIENCES_VENUES,
  ...NATURAL_SCIENCES_1_BUILDING_VENUES,
  ...NATURAL_SCIENCES_2_BUILDING_VENUES,
  ...NATURAL_AND_AGRICULTURAL_SCIENCES_VENUES,
  ...PLANT_SCIENCE_COMPLEX_VENUES,
  ...BOTNAY_VENUES,
  ...ZOOLOGY_BUILDING_VENUES,
  ...MATHEMATICS_BUILDING_VENUES,
  ...LAW_BUILDING_VENUES,
  ...THEOLOGY_BUILDING_VENUES,
  ...DRAMA_BUILDING_VENUES,
  ...VISUAL_ARTS_BUILDING_VENUES,
  ...JAVETT_MUSEUM_VENUES,
  ...STUDENT_CENTER_VENUES,
  ...SCI_ENZA_VENUES,
  ...BOUKUNDE_VENUES,
  ...MINING_SCIENCE_VENUES,
  ...A_E_DU_TOIT_AUDITORIUM_VENUES,
  ...AIM_IT_LABS_VENUES,
  ...AUXILIARY_VENUES,
];
