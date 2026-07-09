import { randomUUID } from 'crypto';

//University
export const UniversityNames: string[] = [
  'University of Pretoria',
  'North-West University',
  'University of Cape Town',
];

//Users
export const UserIDs: string[] = [randomUUID(), randomUUID(), randomUUID()];
export const UserNames: string[] = [
  'Jannie Bloekom',
  'Sarrie Jammer Gat',
  'Piet Pierneef',
];
export const UserEmails: string[] = UserNames.map(
  (name) => `${name}@FlyAtUP.com`,
);
export const UserPasswords: string[] = UserNames.map(
  (name) => `123${name}#123`,
);

//University Roles -> 3 for the three users opf Univeristy of Pretoria
import type { RoleTypeType } from '../../entities';
export const UserUniRoles: RoleTypeType[] = [
  'STUDENT',
  'LECTURER',
  'UNIVERSITY_ADMIN',
]; //Jannie | Sarrie | Piet

//Courses
export const CourseNames: string[] = [
  'Computer Science',
  'Physiology',
  'Psychology',
];
export const CourseDegrees: string[] = [
  'Bachelor of Science',
  'Bachelor of Science',
  'Bachelor of Art',
];
