-- Local login rows for the supercampus database.
-- Password for every college account below: Nmit@1234
-- Safe to run again: existing seed rows are replaced.

USE `supercampus`;

DELETE FROM `global_login`
WHERE `loginId` IN (
  '1nt22ad015.druva@nmit.ac.in',
  'anu.d@nmit.ac.in',
  'campus.admin@nmit.ac.in'
);

DELETE FROM `user`
WHERE `id` IN (
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222223',
  '22222222-2222-4222-8222-222222222224'
);

DELETE FROM `campus_directory`
WHERE `id` IN (
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111114'
);

-- Student. Hostelite is a flag on this row, not a separate login.
INSERT INTO `campus_directory` (
  `id`, `usn`, `fullName`, `collegeEmail`, `role`, `isHostelite`, `department`, `batch`, `program`, `status`, `userId`, `createdBy`
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  '1NT22AD015',
  'Druva',
  '1nt22ad015.druva@nmit.ac.in',
  'STUDENT',
  1,
  'Artificial Intelligence and Data Science',
  '2022',
  'B.E.',
  'active',
  '22222222-2222-4222-8222-222222222222',
  'seed'
);

-- Faculty
INSERT INTO `campus_directory` (
  `id`, `usn`, `fullName`, `collegeEmail`, `role`, `isHostelite`, `department`, `status`, `userId`, `createdBy`
) VALUES (
  '11111111-1111-4111-8111-111111111112',
  'FAC-ANU-D',
  'Anu D',
  'anu.d@nmit.ac.in',
  'FACULTY',
  0,
  'Artificial Intelligence and Data Science',
  'active',
  '22222222-2222-4222-8222-222222222223',
  'seed'
);

-- Campus admin
INSERT INTO `campus_directory` (
  `id`, `usn`, `fullName`, `collegeEmail`, `role`, `isHostelite`, `department`, `status`, `userId`, `createdBy`
) VALUES (
  '11111111-1111-4111-8111-111111111113',
  'ADM-CAMPUS',
  'Campus Admin',
  'campus.admin@nmit.ac.in',
  'CAMPUS_ADMIN',
  0,
  'Administration',
  'active',
  '22222222-2222-4222-8222-222222222224',
  'seed'
);

-- Alumni waiting to claim. No password until an admin approves the mobile number.
INSERT INTO `campus_directory` (
  `id`, `usn`, `fullName`, `collegeEmail`, `role`, `isHostelite`, `department`, `batch`, `status`, `createdBy`
) VALUES (
  '11111111-1111-4111-8111-111111111114',
  '1NT18CS001',
  'Alumni Sample',
  '1nt18cs001.alumni@nmit.ac.in',
  'ALUMNI',
  0,
  'Computer Science',
  '2018',
  'pending',
  'seed'
);

INSERT INTO `user` (
  `id`, `directoryId`, `loginId`, `passwordHash`, `status`, `changePasswordRequired`, `createdBy`
) VALUES
(
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  '1nt22ad015.druva@nmit.ac.in',
  'scrypt$ab8e8c6d6e81e1d13b9ceb69f09dfe58$88f30a053795bd5975c87a68d2b22262179ca922ab11bdd058275444c79a51e9',
  'active',
  1,
  'seed'
),
(
  '22222222-2222-4222-8222-222222222223',
  '11111111-1111-4111-8111-111111111112',
  'anu.d@nmit.ac.in',
  'scrypt$ab8e8c6d6e81e1d13b9ceb69f09dfe58$88f30a053795bd5975c87a68d2b22262179ca922ab11bdd058275444c79a51e9',
  'active',
  1,
  'seed'
),
(
  '22222222-2222-4222-8222-222222222224',
  '11111111-1111-4111-8111-111111111113',
  'campus.admin@nmit.ac.in',
  'scrypt$ab8e8c6d6e81e1d13b9ceb69f09dfe58$88f30a053795bd5975c87a68d2b22262179ca922ab11bdd058275444c79a51e9',
  'active',
  1,
  'seed'
);

INSERT INTO `global_login` (`id`, `loginId`, `tenantId`, `directoryId`) VALUES
(
  '33333333-3333-4333-8333-333333333333',
  '1nt22ad015.druva@nmit.ac.in',
  'nmit',
  '11111111-1111-4111-8111-111111111111'
),
(
  '33333333-3333-4333-8333-333333333334',
  'anu.d@nmit.ac.in',
  'nmit',
  '11111111-1111-4111-8111-111111111112'
),
(
  '33333333-3333-4333-8333-333333333335',
  'campus.admin@nmit.ac.in',
  'nmit',
  '11111111-1111-4111-8111-111111111113'
);
