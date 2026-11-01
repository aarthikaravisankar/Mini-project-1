package com.ambulance108;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.Instant;
import java.util.*;

public class Database {
    private static final Database INSTANCE = new Database();

    public static Database getInstance() {
        return INSTANCE;
    }

    private String dbHost = "localhost";
    private String dbPort = "3306";
    private String dbName = "smart_emergency_ambulance_dispatcher";
    private String dbUser = "root";
    private String dbPassword = "";
    private String dbUrl;

    private Database() {
        loadConfiguration();
        initDatabase();
    }

    private void loadConfiguration() {
        // 1. Try reading config/db.properties if available
        File configFile = new File("backend-java/config/db.properties");
        if (configFile.exists()) {
            try (InputStream in = new FileInputStream(configFile)) {
                Properties props = new Properties();
                props.load(in);
                if (props.getProperty("db.host") != null) dbHost = props.getProperty("db.host").trim();
                if (props.getProperty("db.port") != null) dbPort = props.getProperty("db.port").trim();
                if (props.getProperty("db.name") != null) dbName = props.getProperty("db.name").trim();
                if (props.getProperty("db.user") != null) dbUser = props.getProperty("db.user").trim();
                if (props.getProperty("db.password") != null) dbPassword = props.getProperty("db.password").trim();
                if (props.getProperty("db.url") != null) dbUrl = props.getProperty("db.url").trim();
            } catch (Exception e) {
                System.out.println("[Database Config] Notice: db.properties could not be read (" + e.getMessage() + "), using defaults.");
            }
        }

        // 2. Override with Environment Variables if present
        String envHost = System.getenv("DB_HOST");
        String envPort = System.getenv("DB_PORT");
        String envName = System.getenv("DB_NAME");
        String envUser = System.getenv("DB_USER");
        String envPass = System.getenv("DB_PASSWORD");
        String envUrl = System.getenv("DB_URL");

        if (envHost != null && !envHost.isEmpty()) dbHost = envHost;
        if (envPort != null && !envPort.isEmpty()) dbPort = envPort;
        if (envName != null && !envName.isEmpty()) dbName = envName;
        if (envUser != null && !envUser.isEmpty()) dbUser = envUser;
        if (envPass != null) dbPassword = envPass;

        if (envUrl != null && !envUrl.isEmpty()) {
            dbUrl = envUrl;
        } else if (dbUrl == null || dbUrl.isEmpty()) {
            dbUrl = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName
                    + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&autoReconnect=true";
        }

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("[Database CRITICAL] MySQL Connector/J driver class not found on classpath!");
            throw new RuntimeException("MySQL JDBC Driver missing. Ensure mysql-connector-j jar is present.", e);
        }
    }

    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
    }

    private void initDatabase() {
        System.out.println("[Database] Connecting to MySQL at " + dbUrl + " as user '" + dbUser + "'...");
        try (Connection conn = getConnection()) {
            System.out.println("[Database SUCCESS] Connected to MySQL database '" + conn.getCatalog() + "'.");

            applySafeSchemaUpdates(conn);
            ensureSevenProjectHospitals(conn);
            ensureAmbulances(conn);

        } catch (SQLException e) {
            System.err.println("=======================================================================");
            System.err.println("[Database FATAL ERROR] Could not connect to MySQL database!");
            System.err.println("Target Database: " + dbName + " on " + dbHost + ":" + dbPort);
            System.err.println("Error details: " + e.getMessage());
            System.err.println("Please make sure XAMPP MySQL service is running and database exists.");
            System.err.println("=======================================================================");
            throw new RuntimeException("MySQL database is required as the primary source of truth. JSON fallback disabled.", e);
        }
    }

    private void applySafeSchemaUpdates(Connection conn) {
        String[] updates = new String[]{
                "ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS hospital_type varchar(100) DEFAULT NULL",
                "ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS oxygen_beds int(11) NOT NULL DEFAULT 0",
                "ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS total_beds int(11) NOT NULL DEFAULT 0",

                "ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_name varchar(100) DEFAULT NULL",
                "ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL",
                "ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS caller_logs longtext DEFAULT NULL",
                "ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS completed_at varchar(50) DEFAULT NULL",
                "ALTER TABLE emergency_requests MODIFY COLUMN status varchar(50) NOT NULL DEFAULT 'Registered'",
                "ALTER TABLE emergency_requests MODIFY COLUMN severity varchar(30) NOT NULL DEFAULT 'Medium'",

                "ALTER TABLE ambulances MODIFY COLUMN status varchar(50) NOT NULL DEFAULT 'Available'",
                "ALTER TABLE ambulances MODIFY COLUMN type varchar(50) NOT NULL DEFAULT 'BLS'",
                "ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS dispatch_time varchar(50) DEFAULT NULL",
                "ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS maintenance_notes text DEFAULT NULL",
                "ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS last_updated varchar(50) DEFAULT NULL",

                "ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS vehicle_no varchar(50) DEFAULT NULL",
                "ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS caller_phone varchar(20) DEFAULT NULL",
                "ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS distance_km decimal(6,2) NOT NULL DEFAULT 0.0",
                "ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS outcome text DEFAULT NULL",
                "ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS pickup_time timestamp NULL DEFAULT NULL",
                "ALTER TABLE dispatch_records MODIFY COLUMN status varchar(50) NOT NULL DEFAULT 'Completed'",

                "CREATE TABLE IF NOT EXISTS app_notifications (" +
                        "  id varchar(60) NOT NULL PRIMARY KEY," +
                        "  title varchar(200) NOT NULL," +
                        "  message text NOT NULL," +
                        "  type varchar(30) NOT NULL DEFAULT 'info'," +
                        "  timestamp datetime NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                        "  is_read tinyint(1) NOT NULL DEFAULT 0" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                "ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS is_read tinyint(1) NOT NULL DEFAULT 0"
        };

        for (String sql : updates) {
            try (Statement stmt = conn.createStatement()) {
                stmt.execute(sql);
            } catch (SQLException e) {
                // Ignore benign warnings or duplicate column messages
            }
        }
    }

    private void ensureSevenProjectHospitals(Connection conn) {
        // Exactly Seven core project hospitals in Perundurai and Erode District
        Object[][] hospitals = new Object[][]{
                {"ERODE-HOSP-01", "Govt Medical College Hospital & IRT, Perundurai", "Sanatorium, Perundurai, Erode District", 11.2652, 77.5855, 45, 18, 35, 120, "+91 4294 220912", "Government Medical College / Trauma Care", "Level 1 Trauma Center", "24x7 Trauma Care, Critical Care ICU, Pulmonary Medicine, General Surgery, Orthopedics"},
                {"ERODE-HOSP-02", "Erode Government Headquarters Hospital (GH)", "Brough Road, Erode", 11.3410, 77.7280, 50, 22, 40, 150, "+91 424 225 8333", "District Headquarters Hospital", "Level 1 Trauma Center", "Comprehensive Emergency Care, Critical Care ICU, Cardiology, Orthopedics, Pediatrics"},
                {"ERODE-HOSP-03", "Lotus Hospital & Research Centre", "Poondurai Road, Kollampalayam, Erode", 11.3325, 77.7245, 24, 12, 20, 75, "+91 424 228 2828", "Multi-Speciality & Cardiac Care", "Level 1 Comprehensive", "Cardiology & STEMI, Stroke Center, Multi-organ ICU"},
                {"ERODE-HOSP-04", "Care 24 Hospital / Maruthi Medical Center", "Perundurai Road, Near Collectorate, Erode", 11.3392, 77.7058, 20, 8, 15, 60, "+91 424 226 2266", "24/7 Emergency & Critical Care", "Level 2 Emergency Unit", "Polytrauma, Spine Surgery, Critical Care ICU"},
                {"ERODE-HOSP-05", "Sudha Hospitals (Trauma & Critical Care)", "Perundurai Road, Erode", 11.3435, 77.7112, 18, 10, 16, 55, "+91 424 226 5500", "Trauma & Multispeciality", "Level 1 Trauma & Critical Care", "24x7 Trauma Care, Cardiology, Burns, Neurosurgery"},
                {"ERODE-HOSP-06", "Thangam Hospital & Emergency Center", "Bhavani Road, Perundurai", 11.2750, 77.5920, 16, 6, 12, 40, "+91 4294 221234", "Emergency Care & Surgical Unit", "Level 2 Trauma Care", "Casualty & Emergency, Trauma Stabilization, General Surgery, ICU"},
                {"ERODE-HOSP-07", "Government Hospital, Bhavani", "Mettur Main Road, Varnapuram, Bhavani, Erode District - 638301", 11.4485, 77.6835, 22, 8, 18, 65, "+91 4256 230222", "Sub-District Hospital / Emergency Care", "Level 2 Emergency Care", "24x7 Casualty, Trauma Resuscitation, General Medicine, General Surgery"}
        };

        String insertSql = "INSERT INTO hospitals (hospital_id, name, address, latitude, longitude, emergency_beds, icu_beds, oxygen_beds, total_beds, contact_phone, hospital_type, trauma_level, specialties) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE " +
                "name = VALUES(name), address = VALUES(address), latitude = VALUES(latitude), longitude = VALUES(longitude), " +
                "contact_phone = VALUES(contact_phone), " +
                "hospital_type = VALUES(hospital_type), trauma_level = VALUES(trauma_level), specialties = VALUES(specialties)";

        try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
            for (Object[] h : hospitals) {
                pstmt.setString(1, (String) h[0]);
                pstmt.setString(2, (String) h[1]);
                pstmt.setString(3, (String) h[2]);
                pstmt.setDouble(4, ((Number) h[3]).doubleValue());
                pstmt.setDouble(5, ((Number) h[4]).doubleValue());
                pstmt.setInt(6, ((Number) h[5]).intValue());
                pstmt.setInt(7, ((Number) h[6]).intValue());
                pstmt.setInt(8, ((Number) h[7]).intValue());
                pstmt.setInt(9, ((Number) h[8]).intValue());
                pstmt.setString(10, (String) h[9]);
                pstmt.setString(11, (String) h[10]);
                pstmt.setString(12, (String) h[11]);
                pstmt.setString(13, (String) h[12]);
                pstmt.executeUpdate();
            }
        } catch (SQLException e) {
            System.err.println("[Database Hospital Init] Warning: " + e.getMessage());
        }
    }

    private void ensureAmbulances(Connection conn) {
        // Exactly Seven active driver/ambulance units in Perundurai and Erode
        Object[][] ambList = new Object[][]{
                {"AMB-101", "TN 01 G 1081", "Advanced Life Support (ALS)", 1, "Murugan R.", "9840112345", "Perundurai Old Bus Stand Hub", 11.2780, 77.5840, "Available"},
                {"AMB-102", "TN 01 G 1082", "Basic Life Support (BLS)", 2, "Senthil Kumar", "9840223456", "Chithode Bypass Toll Hub", 11.3910, 77.6830, "Available"},
                {"AMB-103", "TN 02 G 1083", "Advanced Cardiac Life Support", 3, "Karthik Raja", "9840334567", "Erode Railway Station / GH Post", 11.3400, 77.7250, "Available"},
                {"AMB-104", "TN 02 G 1084", "Basic Life Support (BLS)", 4, "Venkatesh S.", "9840445678", "Thindal Ring Road Post", 11.3250, 77.6750, "Available"},
                {"AMB-105", "TN 03 G 1085", "Basic Life Support (BLS)", 5, "Praveen Anand", "9840556789", "Modakkurichi / Solar Post", 11.2950, 77.7400, "Available"},
                {"AMB-106", "TN 03 G 1086", "Advanced Life Support (ALS)", 6, "Deepak Natarajan", "9840667890", "Bhavani New Bus Stand Hub", 11.4480, 77.6830, "Available"},
                {"AMB-107", "TN-33-G-1087", "Advanced Life Support (ALS)", 7, "Ramesh Kumar", "9842110807", "IRT Medical College Campus, Perundurai", 11.2650, 77.5850, "Available"}
        };

        String insertSql = "INSERT INTO ambulances (ambulance_id, vehicle_number, type, driver_id, driver_name, driver_phone, base_station, latitude, longitude, status, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                "ON DUPLICATE KEY UPDATE " +
                "driver_id = VALUES(driver_id), driver_name = VALUES(driver_name), driver_phone = VALUES(driver_phone), " +
                "base_station = VALUES(base_station), latitude = VALUES(latitude), longitude = VALUES(longitude)";

        try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
            for (Object[] a : ambList) {
                pstmt.setString(1, (String) a[0]);
                pstmt.setString(2, (String) a[1]);
                pstmt.setString(3, (String) a[2]);
                pstmt.setInt(4, ((Number) a[3]).intValue());
                pstmt.setString(5, (String) a[4]);
                pstmt.setString(6, (String) a[5]);
                pstmt.setString(7, (String) a[6]);
                pstmt.setDouble(8, ((Number) a[7]).doubleValue());
                pstmt.setDouble(9, ((Number) a[8]).doubleValue());
                pstmt.setString(10, (String) a[9]);
                pstmt.executeUpdate();
            }
        } catch (SQLException e) {
            System.err.println("[Database Ambulance Init] Warning: " + e.getMessage());
        }
    }

    // ==========================================
    // STATS
    // ==========================================
    public synchronized Map<String, Object> getStats() {
        int totalAmb = 0;
        int availAmb = 0;
        int dispAmb = 0;
        int maintAmb = 0;
        int activeInc = 0;
        int completedTrips = 0;
        int totalBeds = 0;

        try (Connection conn = getConnection()) {
            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT " +
                         "COUNT(*) as total, " +
                         "SUM(CASE WHEN LOWER(status) = 'available' THEN 1 ELSE 0 END) as avail, " +
                         "SUM(CASE WHEN LOWER(status) = 'maintenance' THEN 1 ELSE 0 END) as maint, " +
                         "SUM(CASE WHEN LOWER(status) NOT IN ('available', 'maintenance', 'unavailable') THEN 1 ELSE 0 END) as disp " +
                         "FROM ambulances WHERE ambulance_id IN ('AMB-101','AMB-102','AMB-103','AMB-104','AMB-105','AMB-106','AMB-107')")) {
                if (rs.next()) {
                    totalAmb = rs.getInt("total");
                    availAmb = rs.getInt("avail");
                    maintAmb = rs.getInt("maint");
                    dispAmb = rs.getInt("disp");
                }
            }

            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM emergency_requests WHERE LOWER(status) NOT IN ('completed', 'cancelled')")) {
                if (rs.next()) activeInc = rs.getInt(1);
            }

            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM dispatch_records")) {
                if (rs.next()) completedTrips = rs.getInt(1);
            }

            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT SUM(emergency_beds + icu_beds + oxygen_beds) FROM hospitals WHERE hospital_id LIKE 'ERODE-HOSP%'")) {
                if (rs.next()) totalBeds = rs.getInt(1);
            }

        } catch (SQLException e) {
            System.err.println("[Database getStats ERROR] " + e.getMessage());
        }

        Map<String, Object> s = new LinkedHashMap<>();
        s.put("total_ambulances", totalAmb);
        s.put("available_ambulances", availAmb);
        s.put("dispatched_ambulances", dispAmb);
        s.put("maintenance_ambulances", maintAmb);
        s.put("active_incidents", activeInc);
        s.put("completed_trips", completedTrips);
        s.put("total_hospital_beds", totalBeds);
        s.put("system_status", "Operational");
        s.put("storage_mode", "MySQL Database (" + dbName + ")");
        return s;
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    public synchronized Models.Notification addNotification(String title, String message, String type) {
        Models.Notification n = new Models.Notification();
        n.id = "NOTIF-" + System.currentTimeMillis();
        n.title = title;
        n.message = message;
        n.type = type != null ? type : "info";
        n.timestamp = Instant.now().toString();
        n.read = false;

        String sql = "INSERT INTO app_notifications (id, title, message, type, timestamp, is_read) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, n.id);
            pstmt.setString(2, n.title);
            pstmt.setString(3, n.message);
            pstmt.setString(4, n.type);
            pstmt.setBoolean(5, n.read);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[Database addNotification ERROR] " + e.getMessage());
        }
        return n;
    }

    public synchronized List<Map<String, Object>> getNotifications() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM app_notifications ORDER BY timestamp DESC LIMIT 50";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Models.Notification n = new Models.Notification();
                n.id = rs.getString("id");
                n.title = rs.getString("title");
                n.message = rs.getString("message");
                n.type = rs.getString("type");
                Timestamp ts = rs.getTimestamp("timestamp");
                n.timestamp = ts != null ? ts.toInstant().toString() : Instant.now().toString();
                n.read = rs.getBoolean("is_read");
                list.add(n.toMap());
            }
        } catch (SQLException e) {
            System.err.println("[Database getNotifications ERROR] " + e.getMessage());
        }
        return list;
    }

    // ==========================================
    // INCIDENTS (EMERGENCY REQUESTS)
    // ==========================================
    public synchronized String generateNextIncidentId() {
        String sql = "SELECT MAX(CAST(SUBSTRING(incident_id, 5) AS UNSIGNED)) as max_num FROM emergency_requests WHERE incident_id LIKE 'INC-%'";
        int nextNum = 10801;
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                int maxVal = rs.getInt("max_num");
                if (maxVal >= 10800) {
                    nextNum = maxVal + 1;
                }
            }
        } catch (SQLException e) {
            System.err.println("[Database generateNextIncidentId ERROR] " + e.getMessage());
        }
        return "INC-" + nextNum;
    }

    public synchronized Models.Incident createIncident(Models.Incident inc) {
        if (inc.id == null || inc.id.trim().isEmpty()) {
            inc.id = generateNextIncidentId();
        }
        String sql = "INSERT INTO emergency_requests (" +
                "id, incident_id, caller_phone, caller_name, location_name, latitude, longitude, incident_type, severity, " +
                "ambulances_required, status, assigned_ambulance_id, target_hospital_id, target_hospital_name, " +
                "linked_incident_id, duplicate_calls_count, notes, caller_logs, created_at, updated_at" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, inc.id.toLowerCase());
            pstmt.setString(2, inc.id);
            pstmt.setString(3, inc.callerPhone);
            pstmt.setString(4, inc.callerName);
            pstmt.setString(5, inc.locationName);
            pstmt.setDouble(6, inc.latitude);
            pstmt.setDouble(7, inc.longitude);
            pstmt.setString(8, inc.incidentType);
            pstmt.setString(9, inc.severity != null ? inc.severity : "High");
            pstmt.setInt(10, inc.ambulancesRequired > 0 ? inc.ambulancesRequired : 1);
            pstmt.setString(11, inc.status != null ? inc.status : "Registered");
            pstmt.setString(12, inc.assignedAmbulanceId);
            pstmt.setString(13, inc.targetHospitalId);
            pstmt.setString(14, inc.targetHospitalName);
            pstmt.setString(15, inc.linkedIncidentId);
            pstmt.setInt(16, inc.duplicateCallsCount);
            pstmt.setString(17, inc.notes != null ? inc.notes : "");

            List<Map<String, Object>> logsList = new ArrayList<>();
            for (Models.CallerLog cl : inc.callerLogs) logsList.add(cl.toMap());
            pstmt.setString(18, JsonUtil.toJson(logsList));

            pstmt.executeUpdate();
            System.out.println("[Database SUCCESS] Emergency request registered in MySQL: " + inc.id);

        } catch (SQLException e) {
            System.err.println("[Database createIncident ERROR] " + e.getMessage());
            throw new RuntimeException("Failed to insert incident into MySQL: " + e.getMessage(), e);
        }

        return inc;
    }

    public synchronized List<Models.Incident> getIncidents(boolean activeOnly) {
        List<Models.Incident> list = new ArrayList<>();
        String sql = "SELECT er.*, a.vehicle_number as amb_vehicle, a.driver_name as amb_driver, a.driver_phone as amb_phone " +
                "FROM emergency_requests er " +
                "LEFT JOIN ambulances a ON er.assigned_ambulance_id = a.ambulance_id " +
                (activeOnly ? "WHERE LOWER(er.status) NOT IN ('completed', 'cancelled') " : "") +
                "ORDER BY er.created_at DESC";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                list.add(extractIncidentFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[Database getIncidents ERROR] " + e.getMessage());
        }
        return list;
    }

    public synchronized Models.Incident getIncident(String id) {
        String sql = "SELECT er.*, a.vehicle_number as amb_vehicle, a.driver_name as amb_driver, a.driver_phone as amb_phone " +
                "FROM emergency_requests er " +
                "LEFT JOIN ambulances a ON er.assigned_ambulance_id = a.ambulance_id " +
                "WHERE er.incident_id = ? OR er.id = ?";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.setString(2, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return extractIncidentFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[Database getIncident ERROR] " + e.getMessage());
        }
        return null;
    }

    private Models.Incident extractIncidentFromResultSet(ResultSet rs) throws SQLException {
        Models.Incident inc = new Models.Incident();
        inc.id = rs.getString("incident_id");
        if (inc.id == null) inc.id = rs.getString("id");
        inc.callerPhone = rs.getString("caller_phone");
        inc.callerName = rs.getString("caller_name");
        if (inc.callerName == null || inc.callerName.isEmpty()) inc.callerName = "Citizen Caller";
        inc.locationName = rs.getString("location_name");
        inc.latitude = rs.getDouble("latitude");
        inc.longitude = rs.getDouble("longitude");
        inc.incidentType = rs.getString("incident_type");
        inc.severity = rs.getString("severity");
        inc.ambulancesRequired = rs.getInt("ambulances_required");
        inc.status = rs.getString("status");
        inc.assignedAmbulanceId = rs.getString("assigned_ambulance_id");
        inc.targetHospitalId = rs.getString("target_hospital_id");
        inc.targetHospitalName = rs.getString("target_hospital_name");
        inc.linkedIncidentId = rs.getString("linked_incident_id");
        inc.duplicateCallsCount = rs.getInt("duplicate_calls_count");
        inc.notes = rs.getString("notes");
        inc.completedAt = rs.getString("completed_at");

        Timestamp createdTs = rs.getTimestamp("created_at");
        inc.createdAt = createdTs != null ? createdTs.toInstant().toString() : Instant.now().toString();

        Timestamp updatedTs = rs.getTimestamp("updated_at");
        inc.updatedAt = updatedTs != null ? updatedTs.toInstant().toString() : inc.createdAt;

        // Assigned Ambulance Details map
        if (inc.assignedAmbulanceId != null && !inc.assignedAmbulanceId.isEmpty()) {
            Map<String, Object> ambDetails = new LinkedHashMap<>();
            ambDetails.put("vehicle_no", rs.getString("amb_vehicle"));
            ambDetails.put("driver_name", rs.getString("amb_driver"));
            ambDetails.put("driver_phone", rs.getString("amb_phone"));
            inc.assignedAmbulanceDetails = ambDetails;
        }

        // Parse Caller Logs JSON
        String logsJson = rs.getString("caller_logs");
        if (logsJson != null && !logsJson.trim().isEmpty()) {
            try {
                Object parsed = JsonUtil.parse(logsJson);
                if (parsed instanceof List) {
                    for (Object item : (List<?>) parsed) {
                        if (item instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Models.CallerLog cl = Models.CallerLog.fromMap((Map<String, Object>) item);
                            if (cl != null) inc.callerLogs.add(cl);
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        return inc;
    }

    public synchronized Models.Incident updateIncident(String id, Map<String, Object> updates) {
        Models.Incident inc = getIncident(id);
        if (inc == null) return null;

        StringBuilder sql = new StringBuilder("UPDATE emergency_requests SET updated_at = CURRENT_TIMESTAMP");
        List<Object> params = new ArrayList<>();

        if (updates.containsKey("status")) {
            sql.append(", status = ?");
            params.add(updates.get("status"));
            inc.status = (String) updates.get("status");
        }
        if (updates.containsKey("assigned_ambulance_id")) {
            sql.append(", assigned_ambulance_id = ?");
            params.add(updates.get("assigned_ambulance_id"));
            inc.assignedAmbulanceId = (String) updates.get("assigned_ambulance_id");
        }
        if (updates.containsKey("target_hospital_id")) {
            sql.append(", target_hospital_id = ?");
            params.add(updates.get("target_hospital_id"));
            inc.targetHospitalId = (String) updates.get("target_hospital_id");
        }
        if (updates.containsKey("target_hospital_name")) {
            sql.append(", target_hospital_name = ?");
            params.add(updates.get("target_hospital_name"));
            inc.targetHospitalName = (String) updates.get("target_hospital_name");
        }
        if (updates.containsKey("notes")) {
            sql.append(", notes = ?");
            params.add(updates.get("notes"));
            inc.notes = (String) updates.get("notes");
        }
        if (updates.containsKey("completed_at")) {
            sql.append(", completed_at = ?");
            params.add(updates.get("completed_at"));
            inc.completedAt = (String) updates.get("completed_at");
        }
        if (updates.containsKey("duplicate_calls_count")) {
            sql.append(", duplicate_calls_count = ?");
            params.add(updates.get("duplicate_calls_count"));
            if (updates.get("duplicate_calls_count") instanceof Number) {
                inc.duplicateCallsCount = ((Number) updates.get("duplicate_calls_count")).intValue();
            }
        }
        if (updates.containsKey("caller_logs") && updates.get("caller_logs") instanceof List) {
            sql.append(", caller_logs = ?");
            params.add(JsonUtil.toJson(updates.get("caller_logs")));
        }

        sql.append(" WHERE incident_id = ? OR id = ?");
        params.add(inc.id);
        params.add(inc.id);

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                pstmt.setObject(i + 1, params.get(i));
            }
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[Database updateIncident ERROR] " + e.getMessage());
            throw new RuntimeException("Failed to update incident in MySQL: " + e.getMessage(), e);
        }

        return getIncident(inc.id);
    }

    // ==========================================
    // AMBULANCES
    // ==========================================
    public synchronized List<Models.Ambulance> getAmbulances() {
        List<Models.Ambulance> list = new ArrayList<>();
        String sql = "SELECT a.*, " +
                "d.driver_code, d.name as d_name, d.phone as d_phone, " +
                "er.incident_id as inc_id, er.location_name as inc_loc, er.latitude as inc_lat, er.longitude as inc_lon, " +
                "er.incident_type as inc_type, er.severity as inc_sev, er.caller_phone as inc_phone, er.notes as inc_notes " +
                "FROM ambulances a " +
                "LEFT JOIN drivers d ON a.driver_id = d.driver_id " +
                "LEFT JOIN emergency_requests er ON a.current_incident_id = er.incident_id " +
                "WHERE a.ambulance_id IN ('AMB-101','AMB-102','AMB-103','AMB-104','AMB-105','AMB-106','AMB-107') " +
                "ORDER BY a.ambulance_id ASC";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                list.add(extractAmbulanceFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[Database getAmbulances ERROR] " + e.getMessage());
        }
        return list;
    }

    public synchronized Models.Ambulance getAmbulance(String id) {
        String sql = "SELECT a.*, " +
                "d.driver_code, d.name as d_name, d.phone as d_phone, " +
                "er.incident_id as inc_id, er.location_name as inc_loc, er.latitude as inc_lat, er.longitude as inc_lon, " +
                "er.incident_type as inc_type, er.severity as inc_sev, er.caller_phone as inc_phone, er.notes as inc_notes " +
                "FROM ambulances a " +
                "LEFT JOIN drivers d ON a.driver_id = d.driver_id " +
                "LEFT JOIN emergency_requests er ON a.current_incident_id = er.incident_id " +
                "WHERE a.ambulance_id = ?";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return extractAmbulanceFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[Database getAmbulance ERROR] " + e.getMessage());
        }
        return null;
    }

    private Models.Ambulance extractAmbulanceFromResultSet(ResultSet rs) throws SQLException {
        Models.Ambulance a = new Models.Ambulance();
        a.id = rs.getString("ambulance_id");
        a.vehicleNo = rs.getString("vehicle_number");
        a.type = rs.getString("type");
        a.driverName = rs.getString("driver_name");
        a.driverPhone = rs.getString("driver_phone");
        a.baseStation = rs.getString("base_station");
        a.latitude = rs.getDouble("latitude");
        a.longitude = rs.getDouble("longitude");
        a.status = rs.getString("status");
        a.assignedIncidentId = rs.getString("current_incident_id");
        a.targetHospitalId = rs.getString("target_hospital_id");
        a.dispatchTime = rs.getString("dispatch_time");
        a.maintenanceNotes = rs.getString("maintenance_notes");

        String dCode = null;
        try {
            dCode = rs.getString("driver_code");
        } catch (SQLException ignored) {}
        if (dCode == null || dCode.isEmpty()) {
            int dId = 0;
            try { dId = rs.getInt("driver_id"); } catch (SQLException ignored) {}
            if (dId > 0) dCode = "DRV-" + (100 + dId);
        }
        a.driverId = (dCode != null && !dCode.isEmpty()) ? dCode : ("DRV-" + a.id.replace("AMB-", ""));

        Timestamp updatedTs = rs.getTimestamp("updated_at");
        a.lastUpdated = updatedTs != null ? updatedTs.toInstant().toString() : Instant.now().toString();

        if (a.assignedIncidentId != null && !a.assignedIncidentId.isEmpty() && rs.getString("inc_id") != null) {
            Map<String, Object> incData = new LinkedHashMap<>();
            incData.put("id", rs.getString("inc_id"));
            incData.put("location_name", rs.getString("inc_loc"));
            incData.put("latitude", rs.getDouble("inc_lat"));
            incData.put("longitude", rs.getDouble("inc_lon"));
            incData.put("incident_type", rs.getString("inc_type"));
            incData.put("severity", rs.getString("inc_sev"));
            incData.put("caller_phone", rs.getString("inc_phone"));
            incData.put("notes", rs.getString("inc_notes"));
            a.assignedIncident = incData;
        }

        return a;
    }

    public synchronized Models.Ambulance updateAmbulance(String id, Map<String, Object> updates) {
        Models.Ambulance amb = getAmbulance(id);
        if (amb == null) return null;

        StringBuilder sql = new StringBuilder("UPDATE ambulances SET updated_at = CURRENT_TIMESTAMP");
        List<Object> params = new ArrayList<>();

        if (updates.containsKey("status")) {
            sql.append(", status = ?");
            params.add(updates.get("status"));
            amb.status = (String) updates.get("status");
        }
        if (updates.containsKey("latitude") && updates.get("latitude") instanceof Number) {
            sql.append(", latitude = ?");
            params.add(((Number) updates.get("latitude")).doubleValue());
        }
        if (updates.containsKey("longitude") && updates.get("longitude") instanceof Number) {
            sql.append(", longitude = ?");
            params.add(((Number) updates.get("longitude")).doubleValue());
        }
        if (updates.containsKey("assigned_incident_id")) {
            sql.append(", current_incident_id = ?");
            params.add(updates.get("assigned_incident_id"));
        }
        if (updates.containsKey("target_hospital_id")) {
            sql.append(", target_hospital_id = ?");
            params.add(updates.get("target_hospital_id"));
        }
        if (updates.containsKey("dispatch_time")) {
            sql.append(", dispatch_time = ?");
            params.add(updates.get("dispatch_time"));
        }
        if (updates.containsKey("maintenance_notes")) {
            sql.append(", maintenance_notes = ?");
            params.add(updates.get("maintenance_notes"));
        }

        sql.append(" WHERE ambulance_id = ?");
        params.add(id);

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                pstmt.setObject(i + 1, params.get(i));
            }
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[Database updateAmbulance ERROR] " + e.getMessage());
            throw new RuntimeException("Failed to update ambulance in MySQL: " + e.getMessage(), e);
        }

        return getAmbulance(id);
    }

    // ==========================================
    // HOSPITALS & BEDS
    // ==========================================
    public synchronized List<Models.Hospital> getHospitals() {
        List<Models.Hospital> list = new ArrayList<>();
        String sql = "SELECT * FROM hospitals WHERE hospital_id LIKE 'ERODE-HOSP%' ORDER BY hospital_id ASC";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                list.add(extractHospitalFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[Database getHospitals ERROR] " + e.getMessage());
        }
        return list;
    }

    public synchronized Models.Hospital getHospital(String id) {
        String sql = "SELECT * FROM hospitals WHERE hospital_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return extractHospitalFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[Database getHospital ERROR] " + e.getMessage());
        }
        return null;
    }

    private Models.Hospital extractHospitalFromResultSet(ResultSet rs) throws SQLException {
        Models.Hospital h = new Models.Hospital();
        h.id = rs.getString("hospital_id");
        h.name = rs.getString("name");
        h.locationName = rs.getString("address");
        h.latitude = rs.getDouble("latitude");
        h.longitude = rs.getDouble("longitude");
        h.emergencyBeds = rs.getInt("emergency_beds");
        h.icuBeds = rs.getInt("icu_beds");
        h.oxygenBeds = rs.getInt("oxygen_beds");
        h.totalBeds = rs.getInt("total_beds");
        if (h.totalBeds == 0) h.totalBeds = h.emergencyBeds + h.icuBeds + h.oxygenBeds;
        h.contactPhone = rs.getString("contact_phone");
        h.type = rs.getString("hospital_type");
        if (h.type == null || h.type.isEmpty()) h.type = rs.getString("trauma_level");
        h.traumaLevel = rs.getString("trauma_level");
        h.specialties = rs.getString("specialties");
        h.simulated = true;
        return h;
    }

    public synchronized Models.Hospital updateHospitalBeds(String id, int er, int icu, int o2) {
        int safeEr = Math.max(0, er);
        int safeIcu = Math.max(0, icu);
        int safeO2 = Math.max(0, o2);
        int total = safeEr + safeIcu + safeO2;

        String sql = "UPDATE hospitals SET emergency_beds = ?, icu_beds = ?, oxygen_beds = ?, total_beds = ?, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, safeEr);
            pstmt.setInt(2, safeIcu);
            pstmt.setInt(3, safeO2);
            pstmt.setInt(4, total);
            pstmt.setString(5, id);
            pstmt.executeUpdate();
            System.out.println("[Database SUCCESS] Updated beds for " + id + " directly in MySQL: ER=" + safeEr + ", ICU=" + safeIcu + ", O2=" + safeO2);
        } catch (SQLException e) {
            System.err.println("[Database updateHospitalBeds ERROR] " + e.getMessage());
            throw new RuntimeException("Failed to update hospital beds in MySQL: " + e.getMessage(), e);
        }

        return getHospital(id);
    }

    // ==========================================
    // DISPATCH RECORDS / TRIPS
    // ==========================================
    public synchronized String generateNextTripId() {
        String sql = "SELECT MAX(CAST(SUBSTRING(trip_id, 6) AS UNSIGNED)) as max_num FROM dispatch_records WHERE trip_id LIKE 'TRIP-%'";
        int nextNum = 101;
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                int maxVal = rs.getInt("max_num");
                if (maxVal > 0) nextNum = maxVal + 1;
            }
        } catch (SQLException e) {
            System.err.println("[Database generateNextTripId ERROR] " + e.getMessage());
        }
        return "TRIP-" + nextNum;
    }

    public synchronized Models.Trip createTrip(Models.Trip trip) {
        if (trip.tripId == null || trip.tripId.trim().isEmpty()) {
            trip.tripId = generateNextTripId();
        }
        String recId = trip.id != null ? trip.id : trip.tripId.toLowerCase();

        String sql = "INSERT INTO dispatch_records (" +
                "id, trip_id, incident_id, ambulance_id, driver_name, incident_type, location_name, hospital_name, " +
                "dispatch_time, completion_time, duration_minutes, status, created_at, vehicle_no, caller_phone, distance_km, outcome" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 'Completed', CURRENT_TIMESTAMP, ?, ?, ?, ?)";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, recId);
            pstmt.setString(2, trip.tripId);
            pstmt.setString(3, trip.incidentId != null ? trip.incidentId : "INC-10801");
            pstmt.setString(4, trip.ambulanceId != null ? trip.ambulanceId : "AMB-101");
            pstmt.setString(5, trip.driverName != null ? trip.driverName : "Emergency Driver");
            pstmt.setString(6, trip.incidentType != null ? trip.incidentType : "Emergency Medical Response");
            pstmt.setString(7, trip.patientLocation != null ? trip.patientLocation : "Perundurai / Erode Hub");
            pstmt.setString(8, trip.hospitalName != null ? trip.hospitalName : "Govt Medical College Hospital & IRT, Perundurai");
            pstmt.setDouble(9, trip.durationMinutes > 0 ? trip.durationMinutes : 25.0);
            pstmt.setString(10, trip.vehicleNo != null ? trip.vehicleNo : "");
            pstmt.setString(11, trip.callerPhone != null ? trip.callerPhone : "");
            pstmt.setDouble(12, trip.distanceKm > 0 ? trip.distanceKm : 7.2);
            pstmt.setString(13, trip.outcome != null ? trip.outcome : "Patient transported safely to hospital care unit.");

            pstmt.executeUpdate();
            System.out.println("[Database SUCCESS] Dispatch record saved in MySQL: " + trip.tripId);
        } catch (SQLException e) {
            System.err.println("[Database createTrip ERROR] " + e.getMessage());
            throw new RuntimeException("Failed to save trip to MySQL: " + e.getMessage(), e);
        }

        return trip;
    }

    public synchronized List<Models.Trip> getTrips() {
        List<Models.Trip> list = new ArrayList<>();
        String sql = "SELECT * FROM dispatch_records ORDER BY completion_time DESC, created_at DESC";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Models.Trip t = new Models.Trip();
                t.id = rs.getString("id");
                t.tripId = rs.getString("trip_id");
                t.incidentId = rs.getString("incident_id");
                t.ambulanceId = rs.getString("ambulance_id");
                t.driverName = rs.getString("driver_name");
                t.incidentType = rs.getString("incident_type");
                t.patientLocation = rs.getString("location_name");
                t.hospitalName = rs.getString("hospital_name");
                t.vehicleNo = rs.getString("vehicle_no");
                t.callerPhone = rs.getString("caller_phone");
                t.durationMinutes = (int) Math.round(rs.getDouble("duration_minutes"));
                t.distanceKm = rs.getDouble("distance_km");
                t.outcome = rs.getString("outcome");
                t.status = rs.getString("status");

                Timestamp dispTs = rs.getTimestamp("dispatch_time");
                t.dispatchTime = dispTs != null ? dispTs.toInstant().toString() : Instant.now().toString();

                Timestamp compTs = rs.getTimestamp("completion_time");
                t.completionTime = compTs != null ? compTs.toInstant().toString() : Instant.now().toString();

                list.add(t);
            }
        } catch (SQLException e) {
            System.err.println("[Database getTrips ERROR] " + e.getMessage());
        }
        return list;
    }

    // ==========================================
    // DRIVERS
    // ==========================================
    public synchronized List<Models.Driver> getDrivers() {
        List<Models.Driver> list = new ArrayList<>();
        String sql = "SELECT d.driver_id, d.driver_code, d.name, d.phone, d.license_number, d.status as driver_status, " +
                "a.ambulance_id, a.vehicle_number, a.base_station, a.status as amb_status " +
                "FROM drivers d " +
                "LEFT JOIN ambulances a ON d.driver_id = a.driver_id " +
                "ORDER BY d.driver_id ASC";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Models.Driver d = new Models.Driver();
                d.driverId = rs.getInt("driver_id");
                d.driverCode = rs.getString("driver_code");
                if (d.driverCode == null || d.driverCode.isEmpty()) d.driverCode = "DRV-" + (100 + d.driverId);
                d.name = rs.getString("name");
                d.phone = rs.getString("phone");
                d.licenseNumber = rs.getString("license_number");
                d.status = rs.getString("driver_status");
                d.ambulanceId = rs.getString("ambulance_id");
                d.vehicleNo = rs.getString("vehicle_number");
                d.baseStation = rs.getString("base_station");
                list.add(d);
            }
        } catch (SQLException e) {
            System.err.println("[Database getDrivers ERROR] " + e.getMessage());
        }
        return list;
    }

    public synchronized Models.Driver getDriver(String idOrCode) {
        String sql = "SELECT d.driver_id, d.driver_code, d.name, d.phone, d.license_number, d.status as driver_status, " +
                "a.ambulance_id, a.vehicle_number, a.base_station, a.status as amb_status " +
                "FROM drivers d " +
                "LEFT JOIN ambulances a ON d.driver_id = a.driver_id " +
                "WHERE d.driver_code = ? OR CAST(d.driver_id AS CHAR) = ? OR a.ambulance_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, idOrCode);
            pstmt.setString(2, idOrCode);
            pstmt.setString(3, idOrCode);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    Models.Driver d = new Models.Driver();
                    d.driverId = rs.getInt("driver_id");
                    d.driverCode = rs.getString("driver_code");
                    if (d.driverCode == null || d.driverCode.isEmpty()) d.driverCode = "DRV-" + (100 + d.driverId);
                    d.name = rs.getString("name");
                    d.phone = rs.getString("phone");
                    d.licenseNumber = rs.getString("license_number");
                    d.status = rs.getString("driver_status");
                    d.ambulanceId = rs.getString("ambulance_id");
                    d.vehicleNo = rs.getString("vehicle_number");
                    d.baseStation = rs.getString("base_station");
                    return d;
                }
            }
        } catch (SQLException e) {
            System.err.println("[Database getDriver ERROR] " + e.getMessage());
        }
        return null;
    }

    // ==========================================
    // USERS & AUTHENTICATION
    // ==========================================
    public synchronized List<Models.User> getUsers() {
        List<Models.User> list = new ArrayList<>();
        String sql = "SELECT user_id, username, full_name, role, phone, created_at FROM users ORDER BY user_id ASC";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Models.User u = new Models.User();
                u.userId = rs.getInt("user_id");
                u.username = rs.getString("username");
                u.fullName = rs.getString("full_name");
                u.role = rs.getString("role");
                u.phone = rs.getString("phone");
                Timestamp ts = rs.getTimestamp("created_at");
                u.createdAt = ts != null ? ts.toInstant().toString() : Instant.now().toString();
                list.add(u);
            }
        } catch (SQLException e) {
            System.err.println("[Database getUsers ERROR] " + e.getMessage());
        }
        return list;
    }

    public synchronized Map<String, Object> authenticateUser(String usernameOrId, String password, String expectedRole) {
        if (usernameOrId == null || password == null) return null;
        String userTrim = usernameOrId.trim();
        String passTrim = password.trim();

        // Direct DB user query
        String sql = "SELECT user_id, username, password, full_name, role, phone, created_at FROM users " +
                "WHERE LOWER(username) = LOWER(?) OR LOWER(username) = LOWER(?)";

        String normalizedUsername = userTrim;
        if (userTrim.toUpperCase().startsWith("AMB-") || userTrim.toUpperCase().startsWith("DRV-")) {
            String num = userTrim.replace("AMB-", "").replace("DRV-", "");
            normalizedUsername = "driver" + num;
        } else if (userTrim.toUpperCase().startsWith("ERODE-HOSP-") || userTrim.toUpperCase().startsWith("HOSP-")) {
            String num = userTrim.replace("ERODE-HOSP-", "").replace("HOSP-", "");
            normalizedUsername = "hosp-" + num;
        }

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, userTrim);
            pstmt.setString(2, normalizedUsername);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    String dbPass = rs.getString("password");
                    String dbRole = rs.getString("role");

                    boolean passOk = passTrim.equalsIgnoreCase(dbPass);
                    if (!passOk) {
                        if ("operator".equalsIgnoreCase(dbRole) || "admin".equalsIgnoreCase(dbRole)) {
                            passOk = Arrays.asList("108", "control108", "operator123", "admin123").contains(passTrim.toLowerCase());
                        } else if ("driver".equalsIgnoreCase(dbRole)) {
                            passOk = Arrays.asList("108", "driver108", "driver123", "drv-" + userTrim.replace("AMB-", "").replace("DRV-", "").toLowerCase()).contains(passTrim.toLowerCase());
                        } else if ("hospital".equalsIgnoreCase(dbRole)) {
                            passOk = Arrays.asList("108", "hospital108", "hospital123", "hosp-" + userTrim.replace("ERODE-HOSP-", "").replace("HOSP-", "").toLowerCase()).contains(passTrim.toLowerCase());
                        }
                    }

                    if (passOk) {
                        Map<String, Object> userMap = new LinkedHashMap<>();
                        userMap.put("user_id", rs.getInt("user_id"));
                        userMap.put("username", rs.getString("username"));
                        userMap.put("full_name", rs.getString("full_name"));
                        userMap.put("role", dbRole);
                        userMap.put("phone", rs.getString("phone"));
                        if ("driver".equalsIgnoreCase(dbRole)) {
                            String num = rs.getString("username").replace("driver", "");
                            userMap.put("driver_id", "DRV-" + num);
                            userMap.put("ambulance_id", "AMB-" + num);
                        } else if ("hospital".equalsIgnoreCase(dbRole)) {
                            String num = rs.getString("username").replace("hosp-", "");
                            userMap.put("hospital_id", "ERODE-HOSP-" + num);
                        }
                        return userMap;
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("[Database authenticateUser ERROR] " + e.getMessage());
        }

        // Fallback role verification for UI portals
        if ("control_room".equalsIgnoreCase(expectedRole) || "operator".equalsIgnoreCase(expectedRole)) {
            if (Arrays.asList("108", "control108", "operator123", "admin123").contains(passTrim.toLowerCase())) {
                Map<String, Object> userMap = new LinkedHashMap<>();
                userMap.put("user_id", 1);
                userMap.put("username", "operator1");
                userMap.put("full_name", "CAD Control Room Operator");
                userMap.put("role", "operator");
                userMap.put("phone", "9840100001");
                return userMap;
            }
        }

        return null;
    }

    // ==========================================
    // CLEAN SESSION (Preserves DB History, Clears Active State)
    // ==========================================
    public synchronized void clearTestIncidents() {
        // Safe and non-destructive: update active registered calls to Cancelled and free ambulances.
        // NEVER DROP OR TRUNCATE!
        try (Connection conn = getConnection()) {
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("UPDATE emergency_requests SET status = 'Cancelled' WHERE LOWER(status) IN ('registered', 'dispatched')");
                stmt.executeUpdate("UPDATE ambulances SET status = 'Available', current_incident_id = NULL, target_hospital_id = NULL, dispatch_time = NULL WHERE ambulance_id IN ('AMB-101','AMB-102','AMB-103','AMB-104','AMB-105','AMB-106','AMB-107') AND status != 'Maintenance'");
            }
            addNotification("Session Cleared", "All active test calls have been marked completed/cancelled. Ready for fresh registrations.", "info");
            System.out.println("[Database SUCCESS] Clean session applied in MySQL.");
        } catch (SQLException e) {
            System.err.println("[Database clearTestIncidents ERROR] " + e.getMessage());
        }
    }

    public synchronized void initDefaultState(boolean keepSampleTrips) {
        initDatabase();
    }
}
