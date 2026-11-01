-- =====================================================================
-- 108 Emergency Ambulance Dispatch System - MySQL Schema Migration Patch
-- Perundurai & Erode Control Command Hub
-- Target Database: smart_emergency_ambulance_dispatcher
-- =====================================================================

USE `smart_emergency_ambulance_dispatcher`;

-- 1. Safely add missing columns and adjust types for hospitals
ALTER TABLE `hospitals` 
  ADD COLUMN IF NOT EXISTS `hospital_type` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `oxygen_beds` int(11) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `total_beds` int(11) NOT NULL DEFAULT 0;

-- 2. Safely add missing columns and flexible status for emergency_requests
ALTER TABLE `emergency_requests` 
  ADD COLUMN IF NOT EXISTS `caller_name` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `notes` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `caller_logs` longtext DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `completed_at` varchar(50) DEFAULT NULL,
  MODIFY COLUMN `status` varchar(50) NOT NULL DEFAULT 'Registered',
  MODIFY COLUMN `severity` varchar(30) NOT NULL DEFAULT 'Medium';

-- 3. Safely update ambulances table
ALTER TABLE `ambulances` 
  MODIFY COLUMN `status` varchar(50) NOT NULL DEFAULT 'Available',
  MODIFY COLUMN `type` varchar(50) NOT NULL DEFAULT 'BLS',
  ADD COLUMN IF NOT EXISTS `dispatch_time` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `maintenance_notes` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `last_updated` varchar(50) DEFAULT NULL;

-- 4. Safely update dispatch_records table
ALTER TABLE `dispatch_records` 
  ADD COLUMN IF NOT EXISTS `vehicle_no` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `caller_phone` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `distance_km` decimal(6,2) NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS `outcome` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `pickup_time` timestamp NULL DEFAULT NULL,
  MODIFY COLUMN `status` varchar(50) NOT NULL DEFAULT 'Completed';

-- 5. Notifications table
CREATE TABLE IF NOT EXISTS `app_notifications` (
  `id` varchar(60) NOT NULL PRIMARY KEY,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'info',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `app_notifications` 
  ADD COLUMN IF NOT EXISTS `is_read` tinyint(1) NOT NULL DEFAULT 0;

-- 6. Ensure the Seven Erode Regional Hospitals exist
INSERT INTO `hospitals` (`hospital_id`, `name`, `address`, `latitude`, `longitude`, `emergency_beds`, `icu_beds`, `oxygen_beds`, `total_beds`, `contact_phone`, `hospital_type`, `trauma_level`, `specialties`) 
VALUES 
('ERODE-HOSP-01', 'Govt Medical College Hospital & IRT, Perundurai', 'Sanatorium, Perundurai, Erode District', 11.265200, 77.585500, 45, 18, 35, 120, '+91 4294 220912', 'Government Medical College / Trauma Care', 'Level 1 Trauma Center', '24x7 Trauma Care, Critical Care ICU, Pulmonary Medicine, General Surgery, Orthopedics'),
('ERODE-HOSP-02', 'Erode Government Headquarters Hospital (GH)', 'Brough Road, Erode', 11.341000, 77.728000, 50, 22, 40, 150, '+91 424 225 8333', 'District Headquarters Hospital', 'Level 1 Trauma Center', 'Comprehensive Emergency Care, Critical Care ICU, Cardiology, Orthopedics, Pediatrics'),
('ERODE-HOSP-03', 'Lotus Hospital & Research Centre', 'Poondurai Road, Kollampalayam, Erode', 11.332500, 77.724500, 24, 12, 20, 75, '+91 424 228 2828', 'Multi-Speciality & Cardiac Care', 'Level 1 Comprehensive', 'Cardiology & STEMI, Stroke Center, Multi-organ ICU'),
('ERODE-HOSP-04', 'Care 24 Hospital / Maruthi Medical Center', 'Perundurai Road, Near Collectorate, Erode', 11.339200, 77.705800, 20, 8, 15, 60, '+91 424 226 2266', '24/7 Emergency & Critical Care', 'Level 2 Emergency Unit', 'Polytrauma, Spine Surgery, Critical Care ICU'),
('ERODE-HOSP-05', 'Sudha Hospitals (Trauma & Critical Care)', 'Perundurai Road, Erode', 11.343500, 77.711200, 18, 10, 16, 55, '+91 424 226 5500', 'Trauma & Multispeciality', 'Level 1 Trauma & Critical Care', '24x7 Trauma Care, Cardiology, Burns, Neurosurgery'),
('ERODE-HOSP-06', 'Thangam Hospital & Emergency Center', 'Bhavani Road, Perundurai', 11.275000, 77.592000, 16, 6, 12, 40, '+91 4294 221234', 'Emergency Care & Surgical Unit', 'Level 2 Trauma Care', 'Casualty & Emergency, Trauma Stabilization, General Surgery, ICU'),
('ERODE-HOSP-07', 'Government Hospital, Bhavani', 'Mettur Main Road, Varnapuram, Bhavani, Erode District - 638301', 11.448500, 77.683500, 22, 8, 18, 65, '+91 4256 230222', 'Sub-District Hospital / Emergency Care', 'Level 2 Emergency Care', '24x7 Casualty, Trauma Resuscitation, General Medicine, General Surgery')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `address` = VALUES(`address`),
  `latitude` = VALUES(`latitude`),
  `longitude` = VALUES(`longitude`),
  `contact_phone` = VALUES(`contact_phone`),
  `hospital_type` = VALUES(`hospital_type`),
  `trauma_level` = VALUES(`trauma_level`),
  `specialties` = VALUES(`specialties`);

-- 7. Ensure Driver 7 exists in drivers table
INSERT INTO `drivers` (`driver_id`, `driver_code`, `name`, `phone`, `license_number`, `status`, `created_at`)
VALUES (7, 'DRV-107', 'Ramesh Kumar', '9842110807', 'TN-33-2021-0068192', 'OnDuty', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `phone`=VALUES(`phone`);

-- 8. Ensure the Seven Active Ambulances exist with 1:1 Driver Mapping & Hub Locations
INSERT INTO `ambulances` (`ambulance_id`, `vehicle_number`, `type`, `driver_id`, `driver_name`, `driver_phone`, `base_station`, `latitude`, `longitude`, `status`, `created_at`, `updated_at`)
VALUES 
('AMB-101', 'TN 01 G 1081', 'Advanced Life Support (ALS)', 1, 'Murugan R.', '9840112345', 'Perundurai Old Bus Stand Hub', 11.278000, 77.584000, 'Available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AMB-102', 'TN 01 G 1082', 'Basic Life Support (BLS)', 2, 'Senthil Kumar', '9840223456', 'Chithode Bypass Toll Hub', 11.391000, 77.683000, 'Available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AMB-103', 'TN 02 G 1083', 'Advanced Cardiac Life Support', 3, 'Karthik Raja', '9840334567', 'Erode Railway Station / GH Post', 11.340000, 77.725000, 'Available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AMB-104', 'TN 02 G 1084', 'Basic Life Support (BLS)', 4, 'Venkatesh S.', '9840445678', 'Thindal Ring Road Post', 11.325000, 77.675000, 'Available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AMB-105', 'TN 03 G 1085', 'Basic Life Support (BLS)', 5, 'Praveen Anand', '9840556789', 'Modakkurichi / Solar Post', 11.295000, 77.740000, 'Available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AMB-106', 'TN 03 G 1086', 'Advanced Life Support (ALS)', 6, 'Deepak Natarajan', '9840667890', 'Bhavani New Bus Stand Hub', 11.448000, 77.683000, 'Available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AMB-107', 'TN-33-G-1087', 'Advanced Life Support (ALS)', 7, 'Ramesh Kumar', '9842110807', 'IRT Medical College Campus, Perundurai', 11.265000, 77.585000, 'Available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE 
  `driver_id` = VALUES(`driver_id`),
  `driver_name` = VALUES(`driver_name`),
  `driver_phone` = VALUES(`driver_phone`),
  `base_station` = VALUES(`base_station`),
  `latitude` = VALUES(`latitude`),
  `longitude` = VALUES(`longitude`);

-- 9. Ensure Users for all 7 Drivers and 7 Hospitals
INSERT INTO `users` (`username`, `password`, `full_name`, `role`, `phone`) VALUES
('driver101', 'driver123', 'Murugan R. (ALS Pilot)', 'driver', '9840112345'),
('driver102', 'driver123', 'Senthil Kumar (ALS Pilot)', 'driver', '9840223456'),
('driver103', 'driver123', 'Karthik Raja (ACLS Pilot)', 'driver', '9840334567'),
('driver104', 'driver123', 'Venkatesh S. (BLS Pilot)', 'driver', '9840445678'),
('driver105', 'driver123', 'Praveen Anand (BLS Pilot)', 'driver', '9840556789'),
('driver106', 'driver123', 'Deepak Natarajan (ALS Pilot)', 'driver', '9840667890'),
('driver107', 'driver123', 'Ramesh Kumar (ALS Pilot)', 'driver', '9842110807'),
('hosp-01', 'hospital123', 'Govt Medical College Hospital & IRT, Perundurai Desk', 'hospital', '+91 4294 220912'),
('hosp-02', 'hospital123', 'Erode Government Headquarters Hospital (GH) Desk', 'hospital', '+91 424 225 8333'),
('hosp-03', 'hospital123', 'Lotus Hospital & Research Centre Desk', 'hospital', '+91 424 228 2828'),
('hosp-04', 'hospital123', 'Care 24 Hospital Desk', 'hospital', '+91 424 226 2266'),
('hosp-05', 'hospital123', 'Sudha Hospitals Desk', 'hospital', '+91 424 226 5500'),
('hosp-06', 'hospital123', 'Thangam Hospital Desk', 'hospital', '+91 4294 221234'),
('hosp-07', 'hospital123', 'Government Hospital, Bhavani Desk', 'hospital', '+91 4256 230222')
ON DUPLICATE KEY UPDATE `password`=VALUES(`password`), `full_name`=VALUES(`full_name`), `phone`=VALUES(`phone`);
