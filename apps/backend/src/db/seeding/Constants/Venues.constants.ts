import { ActivityType } from 'shared-types';

type UpHatfieldVenueSeed = {
  name: string;
  buildingName: string;
  capacity?: number;
};

//links events to venues based of activity type
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
    'Botany & Zoology Lab 1',
  ],
};

const AULA_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Aula Auditorium', buildingName: 'Aula', capacity: 1025 },
];

const MUSAION_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Musaion Auditorium', buildingName: 'Musaion', capacity: 500 },
];

const AMPHITHEATRE_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Amphitheatre Main', buildingName: 'Amphitheatre', capacity: 3000 },
];

const RAUTENBACH_HALL_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Rautenbach Hall', buildingName: 'Rautenbach Hall', capacity: 0 },
];

const EMS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'EMS Lecture Theatre',
    buildingName: 'Economic and Management Sciences (EMS) Building',
    capacity: 0,
  },
  {
    name: 'EMS 1-1',
    buildingName: 'Economic and Management Sciences (EMS) Building',
    capacity: 150,
  },
  {
    name: 'EMS 1-2',
    buildingName: 'Economic and Management Sciences (EMS) Building',
    capacity: 150,
  },
  {
    name: 'EMS 2-1',
    buildingName: 'Economic and Management Sciences (EMS) Building',
    capacity: 120,
  },
  {
    name: 'EMS 2-2',
    buildingName: 'Economic and Management Sciences (EMS) Building',
    capacity: 120,
  },
];

const IT_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'IT 2-23', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 2-24', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 2-25', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 2-26', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 2-27', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 4-1', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 4-2', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 4-3', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 4-4', buildingName: 'IT Building', capacity: 200 },
  { name: 'IT 4-5', buildingName: 'IT Building', capacity: 200 },
];

const CENTENARY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Centenary 1',
    buildingName: 'Centenary/Eeufees Building',
    capacity: 150,
  },
  {
    name: 'Centenary 2',
    buildingName: 'Centenary/Eeufees Building',
    capacity: 150,
  },
  {
    name: 'Centenary 3',
    buildingName: 'Centenary/Eeufees Building',
    capacity: 150,
  },
  {
    name: 'Centenary 4',
    buildingName: 'Centenary/Eeufees Building',
    capacity: 150,
  },
  {
    name: 'Centenary 5',
    buildingName: 'Centenary/Eeufees Building',
    capacity: 150,
  },
  {
    name: 'Centenary 6',
    buildingName: 'Centenary/Eeufees Building',
    capacity: 150,
  },
];

const ENGINEERING_1_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Eng I 1-1', buildingName: 'Engineering 1 Building', capacity: 0 },
  { name: 'Eng I 1-2', buildingName: 'Engineering 1 Building', capacity: 0 },
  { name: 'Eng I 1-3', buildingName: 'Engineering 1 Building', capacity: 0 },
  { name: 'Eng I 1-4', buildingName: 'Engineering 1 Building', capacity: 0 },
];

const CHEMISTRY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Chemistry Lab 1-24',
    buildingName: 'Chemistry Building',
    capacity: 0,
  },
  {
    name: 'Chemistry Lab 1-40',
    buildingName: 'Chemistry Building',
    capacity: 0,
  },
  {
    name: 'Chemistry Lab 1-40 Ext',
    buildingName: 'Chemistry Building',
    capacity: 0,
  },
  {
    name: 'Large Chemistry Hall',
    buildingName: 'Chemistry Building',
    capacity: 0,
  },
];

// defaults used, no available data on the venues :(
const THUTO_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Thuto 1-1', buildingName: 'Thuto Building', capacity: 300 },
  { name: 'Thuto 1-2', buildingName: 'Thuto Building', capacity: 300 },
  { name: 'Thuto 2-1', buildingName: 'Thuto Building', capacity: 250 },
  { name: 'Thuto 2-2', buildingName: 'Thuto Building', capacity: 250 },
];

const CHANCELLORS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Roos Hall', buildingName: 'Chancellors Building', capacity: 0 },
  {
    name: 'Chancellors 1-1',
    buildingName: 'Chancellors Building',
    capacity: 100,
  },
  {
    name: 'Chancellors 1-2',
    buildingName: 'Chancellors Building',
    capacity: 100,
  },
];

const MERENSKY_LIBRARY_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Research Commons', buildingName: 'Merensky Library', capacity: 0 },
  { name: 'Learning Centre', buildingName: 'Merensky Library', capacity: 0 },
  { name: 'Seminar Room 1', buildingName: 'Merensky Library', capacity: 30 },
  { name: 'Seminar Room 2', buildingName: 'Merensky Library', capacity: 30 },
];

const HUMANITIES_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'HB 1-1', buildingName: 'Humanities Building', capacity: 250 },
  { name: 'HB 1-2', buildingName: 'Humanities Building', capacity: 250 },
  { name: 'HB 2-1', buildingName: 'Humanities Building', capacity: 200 },
  { name: 'HB 2-2', buildingName: 'Humanities Building', capacity: 200 },
  { name: 'HB 3-1', buildingName: 'Humanities Building', capacity: 150 },
];

const NATURAL_SCIENCES_1_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'NAS I 1-1',
    buildingName: 'Natural Sciences 1 Building',
    capacity: 200,
  },
  {
    name: 'NAS I 1-2',
    buildingName: 'Natural Sciences 1 Building',
    capacity: 200,
  },
  {
    name: 'NAS I 2-1',
    buildingName: 'Natural Sciences 1 Building',
    capacity: 150,
  },
];

const AGRICULTURAL_SCIENCES_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Agric Sci 1-1',
    buildingName: 'Agricultural Sciences Building',
    capacity: 150,
  },
  {
    name: 'Agric Sci 1-2',
    buildingName: 'Agricultural Sciences Building',
    capacity: 150,
  },
  {
    name: 'Agric Sci 2-1',
    buildingName: 'Agricultural Sciences Building',
    capacity: 100,
  },
];

const BOTANY_AND_ZOOLOGY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Botany & Zoology 1-1',
    buildingName: 'Botany and Zoology Building',
    capacity: 120,
  },
  {
    name: 'Botany & Zoology 1-2',
    buildingName: 'Botany and Zoology Building',
    capacity: 120,
  },
  {
    name: 'Botany & Zoology Lab 1',
    buildingName: 'Botany and Zoology Building',
    capacity: 0,
  },
];

const ADMIN_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Admin Boardroom 1', buildingName: 'Admin Building', capacity: 40 },
  { name: 'Admin Boardroom 2', buildingName: 'Admin Building', capacity: 40 },
];

const OLD_MERENSKY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Old Merensky 1-1',
    buildingName: 'Old Merensky Building',
    capacity: 100,
  },
  {
    name: 'Old Merensky 1-2',
    buildingName: 'Old Merensky Building',
    capacity: 100,
  },
];

const OLD_ARTS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Old Arts 1-1', buildingName: 'Old Arts Building', capacity: 150 },
  { name: 'Old Arts 1-2', buildingName: 'Old Arts Building', capacity: 150 },
  {
    name: 'Mapungubwe Gallery',
    buildingName: 'Old Arts Building',
    capacity: 0,
  },
];

const ENGINEERING_2_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Eng II 1-1', buildingName: 'Engineering 2 Building', capacity: 200 },
  { name: 'Eng II 1-2', buildingName: 'Engineering 2 Building', capacity: 200 },
  { name: 'Eng II 2-1', buildingName: 'Engineering 2 Building', capacity: 150 },
];

const ENGINEERING_3_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Eng III 1-1',
    buildingName: 'Engineering 3 Building',
    capacity: 150,
  },
  {
    name: 'Eng III 1-2',
    buildingName: 'Engineering 3 Building',
    capacity: 150,
  },
];

const MATHEMATICS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Maths 1-1', buildingName: 'Mathematics Building', capacity: 150 },
  { name: 'Maths 1-2', buildingName: 'Mathematics Building', capacity: 150 },
  { name: 'Maths 2-1', buildingName: 'Mathematics Building', capacity: 100 },
];

const GEOGRAPHY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Geography 1-1', buildingName: 'Geography Building', capacity: 100 },
  { name: 'Geography 1-2', buildingName: 'Geography Building', capacity: 100 },
];

const NATURAL_SCIENCES_2_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'NAS II 1-1',
    buildingName: 'Natural Sciences 2 Building',
    capacity: 200,
  },
  {
    name: 'NAS II 1-2',
    buildingName: 'Natural Sciences 2 Building',
    capacity: 200,
  },
];

const ZOOLOGY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Zoology Lab 1', buildingName: 'Zoology Building', capacity: 0 },
  { name: 'Zoology 1-1', buildingName: 'Zoology Building', capacity: 100 },
];

const OLD_CHEMISTRY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Old Chemistry 1-1',
    buildingName: 'Old Chemistry Building',
    capacity: 100,
  },
  {
    name: 'Old Chemistry Lab 1',
    buildingName: 'Old Chemistry Building',
    capacity: 0,
  },
];

const LAW_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Moot Court', buildingName: 'Law Building', capacity: 0 },
  { name: 'Law 1-1', buildingName: 'Law Building', capacity: 150 },
  { name: 'Law 1-2', buildingName: 'Law Building', capacity: 150 },
];

const THEOLOGY_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Theology 1-1', buildingName: 'Theology Building', capacity: 100 },
  { name: 'Theology 1-2', buildingName: 'Theology Building', capacity: 100 },
];

const DRAMA_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'Masker Theatre', buildingName: 'Drama Building', capacity: 0 },
  { name: 'Lier Theatre', buildingName: 'Drama Building', capacity: 0 },
  { name: 'Drama 1-1', buildingName: 'Drama Building', capacity: 60 },
];

const VISUAL_ARTS_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Visual Arts Studio 1',
    buildingName: 'Visual Arts Building',
    capacity: 0,
  },
  {
    name: 'Visual Arts Studio 2',
    buildingName: 'Visual Arts Building',
    capacity: 0,
  },
  {
    name: 'Visual Arts Lecture Hall',
    buildingName: 'Visual Arts Building',
    capacity: 100,
  },
];

const MUSIC_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Music Practice Room 1',
    buildingName: 'Music Building',
    capacity: 0,
  },
  { name: 'Music Recital Hall', buildingName: 'Music Building', capacity: 80 },
];

const JAVETT_UP_ART_CENTRE_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Javett Auditorium',
    buildingName: 'Javett-UP Art Centre',
    capacity: 0,
  },
  {
    name: 'Javett Gallery 1',
    buildingName: 'Javett-UP Art Centre',
    capacity: 0,
  },
];

const CONFERENCE_CENTRE_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Conference Hall 1',
    buildingName: 'Conference Centre',
    capacity: 200,
  },
  {
    name: 'Conference Hall 2',
    buildingName: 'Conference Centre',
    capacity: 100,
  },
];

const GRADUATE_CENTRE_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Graduate Centre Hall',
    buildingName: 'Graduate Centre',
    capacity: 150,
  },
  {
    name: 'Graduate Centre Seminar Room',
    buildingName: 'Graduate Centre',
    capacity: 40,
  },
];

const STUDENT_CENTRE_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Student Centre Hall',
    buildingName: 'Student Centre Building',
    capacity: 200,
  },
  {
    name: 'Student Centre Meeting Room 1',
    buildingName: 'Student Centre Building',
    capacity: 40,
  },
];

const SCI_ENZA_CENTRE_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Sci-Enza Exhibit Hall',
    buildingName: 'Sci-Enza Centre',
    capacity: 0,
  },
  {
    name: 'Sci-Enza Workshop Room',
    buildingName: 'Sci-Enza Centre',
    capacity: 40,
  },
];

const BUILDING_SCIENCES_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Building Sciences 1-1',
    buildingName: 'Building Sciences Building',
    capacity: 150,
  },
  {
    name: 'Building Sciences 1-2',
    buildingName: 'Building Sciences Building',
    capacity: 150,
  },
];

const MINERAL_SCIENCES_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Mineral Sciences 1-1',
    buildingName: 'Mineral Sciences Building',
    capacity: 100,
  },
  {
    name: 'Mineral Sciences Lab 1',
    buildingName: 'Mineral Sciences Building',
    capacity: 0,
  },
];

const VAN_DER_GRAAF_ACCELERATOR_VENUES: readonly UpHatfieldVenueSeed[] = [
  {
    name: 'Van der Graaf Lab',
    buildingName: 'Van der Graaf Accelerator',
    capacity: 0,
  },
];

const CEFIM_BUILDING_VENUES: readonly UpHatfieldVenueSeed[] = [
  { name: 'CEFIM 1-1', buildingName: 'CEFIM Building', capacity: 80 },
  { name: 'CEFIM 1-2', buildingName: 'CEFIM Building', capacity: 80 },
];

//Combined
export const UP_HATFIELD_VENUES: readonly UpHatfieldVenueSeed[] = [
  ...AULA_VENUES,
  ...MUSAION_VENUES,
  ...AMPHITHEATRE_VENUES,
  ...RAUTENBACH_HALL_VENUES,
  ...EMS_BUILDING_VENUES,
  ...IT_BUILDING_VENUES,
  ...CENTENARY_BUILDING_VENUES,
  ...ENGINEERING_1_BUILDING_VENUES,
  ...CHEMISTRY_BUILDING_VENUES,
  ...THUTO_BUILDING_VENUES,
  ...CHANCELLORS_BUILDING_VENUES,
  ...MERENSKY_LIBRARY_VENUES,
  ...HUMANITIES_BUILDING_VENUES,
  ...NATURAL_SCIENCES_1_BUILDING_VENUES,
  ...AGRICULTURAL_SCIENCES_BUILDING_VENUES,
  ...BOTANY_AND_ZOOLOGY_BUILDING_VENUES,
  ...ADMIN_BUILDING_VENUES,
  ...OLD_MERENSKY_BUILDING_VENUES,
  ...OLD_ARTS_BUILDING_VENUES,
  ...ENGINEERING_2_BUILDING_VENUES,
  ...ENGINEERING_3_BUILDING_VENUES,
  ...MATHEMATICS_BUILDING_VENUES,
  ...GEOGRAPHY_BUILDING_VENUES,
  ...NATURAL_SCIENCES_2_BUILDING_VENUES,
  ...ZOOLOGY_BUILDING_VENUES,
  ...OLD_CHEMISTRY_BUILDING_VENUES,
  ...LAW_BUILDING_VENUES,
  ...THEOLOGY_BUILDING_VENUES,
  ...DRAMA_BUILDING_VENUES,
  ...VISUAL_ARTS_BUILDING_VENUES,
  ...MUSIC_BUILDING_VENUES,
  ...JAVETT_UP_ART_CENTRE_VENUES,
  ...CONFERENCE_CENTRE_VENUES,
  ...GRADUATE_CENTRE_VENUES,
  ...STUDENT_CENTRE_BUILDING_VENUES,
  ...SCI_ENZA_CENTRE_VENUES,
  ...BUILDING_SCIENCES_BUILDING_VENUES,
  ...MINERAL_SCIENCES_BUILDING_VENUES,
  ...VAN_DER_GRAAF_ACCELERATOR_VENUES,
  ...CEFIM_BUILDING_VENUES,
];
