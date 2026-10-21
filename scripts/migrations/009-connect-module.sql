-- 009-connect-module.sql
-- Creates tables for the NMIT Connect module: Events, Clubs, and Opportunities (Internships & Jobs)

CREATE TABLE IF NOT EXISTS `campus_event` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME NOT NULL,
  `capacity` INT NULL,
  `registered_count` INT NOT NULL DEFAULT 0,
  `banner_key` VARCHAR(100) NULL,
  `status` ENUM('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `idx_event_status_starts` (`status`, `starts_at`),
  INDEX `idx_event_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campus_club` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `description` TEXT NOT NULL,
  `lead_user_id` VARCHAR(36) NULL,
  `member_count` INT NOT NULL DEFAULT 1,
  `banner_key` VARCHAR(100) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campus_opportunity` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `company` VARCHAR(150) NOT NULL,
  `type` ENUM('INTERNSHIP', 'JOB') NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `stipend_or_salary` VARCHAR(100) NULL,
  `description` TEXT NOT NULL,
  `apply_url` VARCHAR(500) NULL,
  `deadline` DATETIME NULL,
  `created_by` VARCHAR(36) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `idx_opp_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial clubs if empty
INSERT IGNORE INTO `campus_club` (`id`, `name`, `category`, `description`, `member_count`, `created_by`) VALUES
('club-rob-01', 'Robotics & Automation Club', 'Technology', 'Building autonomous rovers, drones, and competing in National Hackathons.', 42, 'system'),
('club-code-02', 'NMIT Coding Ninjas', 'Coding', 'Weekly competitive programming contests, LeetCode sprints, and open-source contributions.', 85, 'system'),
('club-ieee-03', 'IEEE Student Branch', 'Professional', 'Technical symposiums, IEEE paper publishing workshops, and guest lectures.', 64, 'system'),
('club-photo-04', 'Lumière Photography Club', 'Arts & Culture', 'Capturing campus life, cultural fests, visual storytelling, and exhibitions.', 28, 'system');

-- Seed initial internships & jobs
INSERT IGNORE INTO `campus_opportunity` (`id`, `title`, `company`, `type`, `location`, `stipend_or_salary`, `description`, `apply_url`, `deadline`, `created_by`) VALUES
('opp-int-01', 'Full Stack Engineering Intern', 'Google Developer Student Clubs', 'INTERNSHIP', 'Bengaluru (Hybrid)', '₹25,000 / month', 'Work directly on React Native, NestJS, and cloud infrastructure. Hands-on mentorship from senior industry engineers.', 'https://careers.google.com/students', '2026-11-30 18:00:00', 'system'),
('opp-int-02', 'AI & Machine Learning Research Intern', 'Microsoft Research Labs', 'INTERNSHIP', 'Bengaluru (On-site)', '₹35,000 / month', 'Collaborate on deep learning, transformer fine-tuning, and computer vision pipelines for enterprise edge devices.', 'https://careers.microsoft.com/research', '2026-12-15 23:59:00', 'system'),
('opp-int-03', 'UI/UX Product Design Intern', 'CRED Design Studio', 'INTERNSHIP', 'Bengaluru (On-site)', '₹30,000 / month', 'Design elegant micro-interactions, motion graphics, and mobile design systems for next-gen fintech products.', 'https://cred.club/careers', '2026-11-25 18:00:00', 'system'),
('opp-job-01', 'Associate Software Engineer - Backend', 'Amazon AWS', 'JOB', 'Bengaluru, Karnataka', '₹16 LPA - ₹20 LPA', 'Campus hiring for 2024 & 2025 graduates. High-throughput distributed payment processing engines using TypeScript, Node.js, and DynamoDB.', 'https://amazon.jobs/university', '2026-12-31 23:59:00', 'system'),
('opp-job-02', 'Cloud DevOps & SRE Associate', 'Cisco Systems', 'JOB', 'Bengaluru (Hybrid)', '₹12 LPA - ₹15 LPA', 'Manage automated CI/CD pipelines, Docker containers, Kubernetes orchestration, and multi-region AWS cloud infrastructure.', 'https://jobs.cisco.com', '2026-11-28 18:00:00', 'system'),
('opp-job-03', 'Cybersecurity Analyst', 'Palo Alto Networks', 'JOB', 'Bengaluru, Karnataka', '₹14 LPA - ₹17 LPA', 'Monitor threat telemetry, conduct vulnerability assessments, and implement zero-trust access controls for enterprise networks.', 'https://paloaltonetworks.com/careers', '2026-12-20 23:59:00', 'system');

