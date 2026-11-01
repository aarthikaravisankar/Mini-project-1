-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 30, 2026 at 04:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smart_emergency_ambulance_dispatcher`
--

-- --------------------------------------------------------

--
-- Table structure for table `ambulances`
--

CREATE TABLE `ambulances` (
  `ambulance_id` varchar(50) NOT NULL,
  `vehicle_number` varchar(50) NOT NULL,
  `type` enum('ALS','BLS') NOT NULL DEFAULT 'BLS',
  `driver_id` int(11) DEFAULT NULL,
  `driver_name` varchar(100) NOT NULL,
  `driver_phone` varchar(20) NOT NULL,
  `latitude` decimal(10,6) NOT NULL,
  `longitude` decimal(10,6) NOT NULL,
  `base_station` varchar(100) NOT NULL,
  `status` enum('Available','Dispatched','OnScene','InTransit','Unavailable') NOT NULL DEFAULT 'Available',
  `unavailable_reason` varchar(255) DEFAULT NULL,
  `current_incident_id` varchar(50) DEFAULT NULL,
  `target_hospital_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ambulances`
--

INSERT INTO `ambulances` (`ambulance_id`, `vehicle_number`, `type`, `driver_id`, `driver_name`, `driver_phone`, `latitude`, `longitude`, `base_station`, `status`, `unavailable_reason`, `current_incident_id`, `target_hospital_id`, `created_at`, `updated_at`) VALUES
('AMB-101', 'TN 01 G 1081', 'ALS', 1, 'Murugan R.', '9840112345', 13.083500, 80.272500, 'Central Bus Stand Standpost', 'InTransit', NULL, 'INC-10802', 'HOSP-01', '2026-10-28 08:31:13', '2026-10-28 12:19:05'),
('AMB-102', 'TN 01 G 1082', 'ALS', 2, 'Senthil Kumar', '9840223456', 13.078200, 80.260500, 'Egmore Hub', 'Available', NULL, NULL, NULL, '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('AMB-103', 'TN 02 G 1083', 'BLS', 3, 'Karthik Raja', '9840334567', 13.050000, 80.240000, 'T. Nagar Panagal Park', 'Available', NULL, NULL, NULL, '2026-10-28 08:31:13', '2026-10-28 12:24:46'),
('AMB-104', 'TN 02 G 1084', 'BLS', 4, 'Venkatesh S.', '9840445678', 13.067400, 80.210000, 'Koyambedu CMBT Hub', 'Available', NULL, NULL, NULL, '2026-10-28 08:31:13', '2026-10-28 08:32:49'),
('AMB-105', 'TN 03 G 1085', 'ALS', 5, 'Praveen Anand', '9840556789', 13.010000, 80.215000, 'Guindy Industrial Depot', 'Available', NULL, NULL, NULL, '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('AMB-106', 'TN 03 G 1086', 'BLS', 6, 'Deepak Natarajan', '9840667890', 13.085000, 80.285000, 'Royapuram Coastal Depot', 'Available', NULL, NULL, NULL, '2026-10-28 08:31:13', '2026-10-28 12:20:26');

-- --------------------------------------------------------

--
-- Table structure for table `dispatch_records`
--

CREATE TABLE `dispatch_records` (
  `id` varchar(50) NOT NULL,
  `trip_id` varchar(50) NOT NULL,
  `incident_id` varchar(50) NOT NULL,
  `ambulance_id` varchar(50) NOT NULL,
  `driver_name` varchar(100) NOT NULL,
  `incident_type` varchar(100) NOT NULL,
  `location_name` varchar(255) NOT NULL,
  `hospital_name` varchar(150) DEFAULT NULL,
  `dispatch_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `arrival_scene_time` timestamp NULL DEFAULT NULL,
  `hospital_arrival_time` timestamp NULL DEFAULT NULL,
  `completion_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `duration_minutes` decimal(5,1) NOT NULL DEFAULT 0.0,
  `status` enum('Active','Completed','Cancelled') NOT NULL DEFAULT 'Completed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dispatch_records`
--

INSERT INTO `dispatch_records` (`id`, `trip_id`, `incident_id`, `ambulance_id`, `driver_name`, `incident_type`, `location_name`, `hospital_name`, `dispatch_time`, `arrival_scene_time`, `hospital_arrival_time`, `completion_time`, `duration_minutes`, `status`, `created_at`) VALUES
('trip-101', 'TRIP-101', 'INC-10801', 'AMB-101', 'Murugan R.', 'Acute Chest Pain / STEMI', 'Anna Salai Near LIC Building', 'Rajiv Gandhi Govt General Hospital (RGGGH)', '2026-10-28 07:46:13', NULL, NULL, '2026-10-28 08:13:13', 27.0, 'Completed', '2026-10-28 08:31:13'),
('trip-102', 'TRIP-102', 'INC-10803', 'AMB-106', 'Deepak Natarajan', 'Road Traffic Accident', 'Test Site Marina Beach', 'Rajiv Gandhi Govt General Hospital (RGGGH)', '2026-10-28 12:18:47', NULL, NULL, '2026-10-28 12:19:47', 1.0, 'Completed', '2026-10-28 12:19:47'),
('trip-103', 'TRIP-103', 'INC-10804', 'AMB-106', 'Deepak Natarajan', 'Road Traffic Accident', 'Test Site Marina Beach', 'Rajiv Gandhi Govt General Hospital (RGGGH)', '2026-10-28 12:19:26', NULL, NULL, '2026-10-28 12:20:26', 1.0, 'Completed', '2026-10-28 12:20:26'),
('trip-104', 'TRIP-104', 'INC-10805', 'AMB-103', 'Karthik Raja', 'Severe Breathlessness / Asthma', 'Marina Beach Lighthouse Stand', 'Rajiv Gandhi Govt General Hospital (RGGGH)', '2026-10-28 12:23:45', NULL, NULL, '2026-10-28 12:24:45', 1.0, 'Completed', '2026-10-28 12:24:45');

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `driver_id` int(11) NOT NULL,
  `driver_code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `license_number` varchar(50) NOT NULL,
  `status` enum('OnDuty','OffDuty','OnTrip') NOT NULL DEFAULT 'OnDuty',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`driver_id`, `driver_code`, `name`, `phone`, `license_number`, `status`, `created_at`) VALUES
(1, 'DRV-101', 'Murugan R.', '9840112345', 'TN-01-2015-0019283', 'OnDuty', '2026-10-28 08:31:13'),
(2, 'DRV-102', 'Senthil Kumar', '9840223456', 'TN-01-2016-0028472', 'OnDuty', '2026-10-28 08:31:13'),
(3, 'DRV-103', 'Karthik Raja', '9840334567', 'TN-02-2018-0091823', 'OnDuty', '2026-10-28 08:31:13'),
(4, 'DRV-104', 'Venkatesh S.', '9840445678', 'TN-02-2017-0038192', 'OnDuty', '2026-10-28 08:31:13'),
(5, 'DRV-105', 'Praveen Anand', '9840556789', 'TN-03-2019-0048192', 'OnDuty', '2026-10-28 08:31:13'),
(6, 'DRV-106', 'Deepak Natarajan', '9840667890', 'TN-03-2020-0059102', 'OnDuty', '2026-10-28 08:31:13');

-- --------------------------------------------------------

--
-- Table structure for table `emergency_requests`
--

CREATE TABLE `emergency_requests` (
  `id` varchar(50) NOT NULL,
  `incident_id` varchar(50) NOT NULL,
  `caller_phone` varchar(20) NOT NULL,
  `location_name` varchar(255) NOT NULL,
  `latitude` decimal(10,6) NOT NULL,
  `longitude` decimal(10,6) NOT NULL,
  `incident_type` varchar(100) NOT NULL,
  `severity` enum('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `ambulances_required` int(11) NOT NULL DEFAULT 1,
  `status` enum('Registered','Dispatched','OnScene','InTransit','Completed','Cancelled','LinkedDuplicate') NOT NULL DEFAULT 'Registered',
  `assigned_ambulance_id` varchar(50) DEFAULT NULL,
  `target_hospital_id` varchar(50) DEFAULT NULL,
  `target_hospital_name` varchar(150) DEFAULT NULL,
  `linked_incident_id` varchar(50) DEFAULT NULL,
  `duplicate_calls_count` int(11) NOT NULL DEFAULT 0,
  `forwarded_to` varchar(150) DEFAULT NULL,
  `forwarding_status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `emergency_requests`
--

INSERT INTO `emergency_requests` (`id`, `incident_id`, `caller_phone`, `location_name`, `latitude`, `longitude`, `incident_type`, `severity`, `ambulances_required`, `status`, `assigned_ambulance_id`, `target_hospital_id`, `target_hospital_name`, `linked_incident_id`, `duplicate_calls_count`, `forwarded_to`, `forwarding_status`, `created_at`, `updated_at`) VALUES
('inc-10801', 'INC-10801', '9841029384', 'Central Bus Stand (Near Bay 4)', 13.082680, 80.270718, 'Road Traffic Accident', 'High', 1, 'Registered', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('inc-10802', 'INC-10802', '9840999999', 'Test Site Marina Beach', 13.050000, 80.282400, 'Road Traffic Accident', 'High', 1, 'InTransit', 'AMB-101', 'HOSP-01', 'Rajiv Gandhi Govt General Hospital (RGGGH)', NULL, 0, NULL, NULL, '2026-10-28 12:19:04', '2026-10-28 12:19:05'),
('inc-10803', 'INC-10803', '9840999999', 'Test Site Marina Beach', 13.050000, 80.282400, 'Road Traffic Accident', 'High', 1, 'Completed', 'AMB-106', 'HOSP-01', 'Rajiv Gandhi Govt General Hospital (RGGGH)', NULL, 0, NULL, NULL, '2026-10-28 12:19:47', '2026-10-28 12:19:48'),
('inc-10804', 'INC-10804', '9840999999', 'Test Site Marina Beach', 13.050000, 80.282400, 'Road Traffic Accident', 'High', 1, 'Completed', 'AMB-106', 'HOSP-01', 'Rajiv Gandhi Govt General Hospital (RGGGH)', NULL, 0, NULL, NULL, '2026-10-28 12:20:25', '2026-10-28 12:20:26'),
('inc-10805', 'INC-10805', '9840123999', 'Marina Beach Lighthouse Stand', 13.039800, 80.278500, 'Severe Breathlessness / Asthma', 'High', 1, 'Completed', 'AMB-103', NULL, NULL, NULL, 0, NULL, NULL, '2026-10-28 12:23:37', '2026-10-28 12:24:45');

-- --------------------------------------------------------

--
-- Table structure for table `forwarded_calls`
--

CREATE TABLE `forwarded_calls` (
  `id` varchar(50) NOT NULL,
  `caller_phone` varchar(20) NOT NULL,
  `location_name` varchar(255) NOT NULL,
  `latitude` decimal(10,6) NOT NULL,
  `longitude` decimal(10,6) NOT NULL,
  `incident_type` varchar(100) NOT NULL,
  `forwarded_from` varchar(150) NOT NULL,
  `forwarded_to` varchar(150) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Transferred',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `hospital_id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` varchar(255) NOT NULL,
  `latitude` decimal(10,6) NOT NULL,
  `longitude` decimal(10,6) NOT NULL,
  `emergency_beds` int(11) NOT NULL DEFAULT 0,
  `icu_beds` int(11) NOT NULL DEFAULT 0,
  `contact_phone` varchar(30) NOT NULL,
  `trauma_level` varchar(50) NOT NULL,
  `specialties` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`hospital_id`, `name`, `address`, `latitude`, `longitude`, `emergency_beds`, `icu_beds`, `contact_phone`, `trauma_level`, `specialties`, `created_at`, `updated_at`) VALUES
('HOSP-01', 'Rajiv Gandhi Govt General Hospital (RGGGH)', 'EVR Periyar Salai, Park Town, Chennai', 13.081800, 80.278500, 14, 6, '044-25305000', 'Level 1 Trauma Center', '24x7 Trauma Care, Cardiology, Burns, Neurosurgery', '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('HOSP-02', 'Stanley Medical College Hospital', 'Old Jail Road, Royapuram, Chennai', 13.107000, 80.288000, 9, 3, '044-25281351', 'Level 1 Trauma Center', 'Trauma, Plastic Surgery, Pediatrics, ICU', '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('HOSP-03', 'Apollo Hospitals', 'Greams Road, Thousand Lights, Chennai', 13.058500, 80.252000, 8, 4, '044-28290200', 'Level 1 Comprehensive', 'Cardiology & STEMI, Stroke Center, Multi-organ ICU', '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('HOSP-04', 'Government Kilpauk Medical College Hospital', 'Poonamallee High Road, Kilpauk, Chennai', 13.079200, 80.243500, 12, 5, '044-28364951', 'Level 2 Trauma Center', 'Burns Specialist Unit, Emergency Medicine, Orthopedics', '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('HOSP-05', 'MIOT International Hospital', 'Mount Poonamallee Road, Manapakkam, Chennai', 13.018500, 80.183000, 6, 2, '044-42002288', 'Level 1 Trauma & Ortho', 'Polytrauma, Spine Surgery, Critical Care ICU', '2026-10-28 08:31:13', '2026-10-28 08:31:13'),
('HOSP-06', 'Government Erode Medical College Hospital & IRT, Perundurai', 'Sanatorium Campus, NH 544, Perundurai, Erode District - 638053', 11.265200, 77.585500, 45, 18, '04294-220912', 'Level 1 Trauma Center', '24x7 Trauma Care, Critical Care ICU, Pulmonary Medicine, General Surgery, Orthopedics', '2026-10-28 17:11:09', '2026-10-28 17:11:09'),
('HOSP-07', 'Government Headquarters Hospital, Erode', 'EVN Road, Near Clock Tower, Erode, Tamil Nadu - 638009', 11.341000, 77.728000, 50, 22, '0424-2253676', 'Level 1 Trauma Center', 'Comprehensive Emergency Care, Critical Care ICU, Cardiology, Orthopedics, Pediatrics', '2026-10-28 17:11:09', '2026-10-28 17:11:09'),
('HOSP-08', 'Government Hospital, Bhavani', 'Mettur Main Road, Varnapuram, Bhavani, Erode District - 638301', 11.448500, 77.683000, 20, 6, '04256-230333', 'Level 2 Trauma & Emergency Unit', 'Emergency Medicine, 24x7 Casualty, Maternity, General Surgery', '2026-10-28 17:11:09', '2026-10-28 17:11:09'),
('HOSP-09', 'Government Hospital, Gobichettipalayam', 'Govt Hospital Road, Modachur Road, Gobichettipalayam, Erode District - 638452', 11.454200, 77.438500, 25, 8, '04285-222053', 'Level 2 Trauma & Emergency Unit', 'Trauma & Emergency Care, Intensive Care, Neonatal Care, General Surgery', '2026-10-28 17:11:09', '2026-10-28 17:11:09'),
('HOSP-10', 'Government Hospital, Sathyamangalam', 'Malayadipudur, Sathyamangalam, Erode District - 638401', 11.503500, 77.245000, 18, 6, '04295-220239', 'Level 2 Trauma Care', 'Casualty & Emergency, Trauma Stabilization, General Surgery, ICU', '2026-10-28 17:11:09', '2026-10-28 17:11:09'),
('HOSP-11', 'Government Hospital, Anthiyur', 'Bargur Main Road, Near Bus Stand, Anthiyur, Erode District - 638501', 11.583300, 77.583300, 15, 4, '04256-261350', 'Level 2 Emergency Unit', '24x7 Casualty, Emergency Stabilization, Maternity, General Medicine', '2026-10-28 17:11:09', '2026-10-28 17:11:09');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('operator','driver','admin') NOT NULL DEFAULT 'operator',
  `phone` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `role`, `phone`, `created_at`) VALUES
(1, 'operator1', 'operator123', 'Rajesh K. (Senior CAD Operator)', 'operator', '9840100001', '2026-10-28 08:31:13'),
(2, 'driver101', 'driver123', 'Murugan R. (ALS Pilot)', 'driver', '9840112345', '2026-10-28 08:31:13'),
(3, 'driver102', 'driver123', 'Senthil Kumar (ALS Pilot)', 'driver', '9840223456', '2026-10-28 08:31:13'),
(4, 'admin', 'admin123', 'Dr. Anand V. (Fleet Controller)', 'admin', '9840100009', '2026-10-28 08:31:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ambulances`
--
ALTER TABLE `ambulances`
  ADD PRIMARY KEY (`ambulance_id`),
  ADD UNIQUE KEY `vehicle_number` (`vehicle_number`),
  ADD KEY `fk_amb_driver` (`driver_id`),
  ADD KEY `fk_amb_hospital` (`target_hospital_id`),
  ADD KEY `idx_ambulances_status` (`status`),
  ADD KEY `idx_ambulances_type` (`type`);

--
-- Indexes for table `dispatch_records`
--
ALTER TABLE `dispatch_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `trip_id` (`trip_id`),
  ADD KEY `fk_disp_incident` (`incident_id`),
  ADD KEY `idx_dispatch_completion` (`completion_time`),
  ADD KEY `idx_dispatch_ambulance` (`ambulance_id`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`driver_id`),
  ADD UNIQUE KEY `driver_code` (`driver_code`),
  ADD UNIQUE KEY `license_number` (`license_number`),
  ADD KEY `idx_drivers_status` (`status`);

--
-- Indexes for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `incident_id` (`incident_id`),
  ADD KEY `fk_req_ambulance` (`assigned_ambulance_id`),
  ADD KEY `fk_req_hospital` (`target_hospital_id`),
  ADD KEY `idx_requests_status` (`status`),
  ADD KEY `idx_requests_severity` (`severity`),
  ADD KEY `idx_requests_created` (`created_at`);

--
-- Indexes for table `forwarded_calls`
--
ALTER TABLE `forwarded_calls`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`hospital_id`),
  ADD KEY `idx_hospitals_beds` (`emergency_beds`,`icu_beds`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `driver_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ambulances`
--
ALTER TABLE `ambulances`
  ADD CONSTRAINT `fk_amb_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`driver_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_amb_hospital` FOREIGN KEY (`target_hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE SET NULL;

--
-- Constraints for table `dispatch_records`
--
ALTER TABLE `dispatch_records`
  ADD CONSTRAINT `fk_disp_ambulance` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`ambulance_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_disp_incident` FOREIGN KEY (`incident_id`) REFERENCES `emergency_requests` (`incident_id`) ON DELETE CASCADE;

--
-- Constraints for table `emergency_requests`
--
ALTER TABLE `emergency_requests`
  ADD CONSTRAINT `fk_req_ambulance` FOREIGN KEY (`assigned_ambulance_id`) REFERENCES `ambulances` (`ambulance_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_req_hospital` FOREIGN KEY (`target_hospital_id`) REFERENCES `hospitals` (`hospital_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
