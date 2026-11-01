package com.ambulance108;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;

public class Server {

    private static final int PORT = 8001;
    private static final Database db = Database.getInstance();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", PORT), 0);
        server.setExecutor(Executors.newFixedThreadPool(16));

        server.createContext("/", new ApiHandler());

        System.out.println("==============================================================");
        System.out.println(" 108 Emergency Ambulance Dispatch System - Java Backend");
        System.out.println(" Perundurai & Erode District Hub (Tamil Nadu)");
        System.out.println(" Status: Operational on http://localhost:" + PORT + "/");
        System.out.println(" Technology: Java Standard Server + MySQL JDBC (smart_emergency_ambulance_dispatcher)");
        System.out.println("==============================================================");

        server.start();
    }

    private static class ApiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Apply CORS headers to all responses
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

            String method = exchange.getRequestMethod().toUpperCase();
            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }

            String path = exchange.getRequestURI().getPath();
            String query = exchange.getRequestURI().getRawQuery();
            Map<String, String> queryParams = parseQueryParams(query);
            System.out.println("[API] " + method + " " + path);

            try {
                if ("/".equals(path)) {
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("system", "108 Emergency Ambulance Dispatch System");
                    resp.put("region", "Perundurai & Erode District, Tamil Nadu");
                    resp.put("status", "Operational");
                    resp.put("version", "1.0.0");
                    resp.put("backend", "Java 26 Standard Server");
                    sendJson(exchange, 200, resp);
                    return;
                }

                if ("/api/health".equals(path)) {
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("status", "Healthy");
                    resp.put("timestamp", Instant.now().toString());
                    resp.put("storage", "MySQL Database (smart_emergency_ambulance_dispatcher)");
                    sendJson(exchange, 200, resp);
                    return;
                }

                if ("/api/stats".equals(path) && "GET".equals(method)) {
                    sendJson(exchange, 200, db.getStats());
                    return;
                }

                if ("/api/notifications".equals(path) && "GET".equals(method)) {
                    sendJson(exchange, 200, db.getNotifications());
                    return;
                }

                if ("/api/duplicate-check".equals(path) && "POST".equals(method)) {
                    handleDuplicateCheck(exchange);
                    return;
                }

                if ("/api/incidents".equals(path)) {
                    if ("GET".equals(method)) {
                        boolean activeOnly = "true".equalsIgnoreCase(queryParams.get("active_only"));
                        List<Models.Incident> incs = db.getIncidents(activeOnly);
                        List<Map<String, Object>> resList = new ArrayList<>();
                        for (Models.Incident i : incs) resList.add(i.toMap());
                        sendJson(exchange, 200, resList);
                        return;
                    } else if ("POST".equals(method)) {
                        handleRegisterIncident(exchange, queryParams);
                        return;
                    }
                }

                if (path.startsWith("/api/incidents/") && path.endsWith("/link") && "POST".equals(method)) {
                    String incId = path.substring("/api/incidents/".length(), path.length() - "/link".length());
                    handleLinkCall(exchange, incId);
                    return;
                }

                if (path.startsWith("/api/incidents/") && "GET".equals(method)) {
                    String incId = path.substring("/api/incidents/".length());
                    Models.Incident inc = db.getIncident(incId);
                    if (inc == null) {
                        sendError(exchange, 404, "Incident not found");
                    } else {
                        sendJson(exchange, 200, inc.toMap());
                    }
                    return;
                }

                if ("/api/call-forward".equals(path) && "POST".equals(method)) {
                    handleCallForward(exchange);
                    return;
                }

                if ("/api/priority-queue".equals(path) && "GET".equals(method)) {
                    List<Models.Incident> activeInc = db.getIncidents(true);
                    List<Models.Incident> pending = new ArrayList<>();
                    for (Models.Incident inc : activeInc) {
                        if ("Registered".equalsIgnoreCase(inc.status) || "Pending Dispatch".equalsIgnoreCase(inc.status)) {
                            pending.add(inc);
                        }
                    }
                    sendJson(exchange, 200, PriorityQueueService.buildPriorityQueueResponse(pending));
                    return;
                }

                if (path.startsWith("/api/dispatch/recommend/") && "GET".equals(method)) {
                    String incId = path.substring("/api/dispatch/recommend/".length());
                    handleRecommendAmbulance(exchange, incId);
                    return;
                }

                if ("/api/dispatch/confirm".equals(path) && "POST".equals(method)) {
                    handleConfirmDispatch(exchange);
                    return;
                }

                if ("/api/ambulances".equals(path) && "GET".equals(method)) {
                    List<Models.Ambulance> list = db.getAmbulances();
                    List<Map<String, Object>> out = new ArrayList<>();
                    for (Models.Ambulance a : list) out.add(a.toMap());
                    sendJson(exchange, 200, out);
                    return;
                }

                if (path.startsWith("/api/ambulances/") && path.endsWith("/status") && "POST".equals(method)) {
                    String ambId = path.substring("/api/ambulances/".length(), path.length() - "/status".length());
                    handleAmbulanceStatusToggle(exchange, ambId);
                    return;
                }

                if (path.startsWith("/api/ambulances/") && "GET".equals(method)) {
                    String ambId = path.substring("/api/ambulances/".length());
                    Models.Ambulance a = db.getAmbulance(ambId);
                    if (a == null) {
                        sendError(exchange, 404, "Ambulance not found");
                    } else {
                        sendJson(exchange, 200, a.toMap());
                    }
                    return;
                }

                if ("/api/driver/status".equals(path) && "POST".equals(method)) {
                    handleDriverStatusUpdate(exchange);
                    return;
                }

                if ("/api/hospitals".equals(path) && "GET".equals(method)) {
                    List<Models.Hospital> list = db.getHospitals();
                    List<Map<String, Object>> out = new ArrayList<>();
                    for (Models.Hospital h : list) out.add(h.toMap());
                    sendJson(exchange, 200, out);
                    return;
                }

                if (path.startsWith("/api/hospitals/recommend/") && "GET".equals(method)) {
                    String incId = path.substring("/api/hospitals/recommend/".length());
                    boolean requireIcu = "true".equalsIgnoreCase(queryParams.get("require_icu"));
                    handleHospitalRecommend(exchange, incId, requireIcu);
                    return;
                }

                if (path.startsWith("/api/hospitals/") && path.endsWith("/beds")) {
                    String hospId = path.substring("/api/hospitals/".length(), path.length() - "/beds".length());
                    if ("PUT".equalsIgnoreCase(method)) {
                        handleHospitalBedUpdate(exchange, hospId);
                        return;
                    } else if ("GET".equalsIgnoreCase(method)) {
                        handleGetHospitalBeds(exchange, hospId);
                        return;
                    }
                }

                if (("/api/login".equalsIgnoreCase(path) || "/api/login/".equalsIgnoreCase(path) || "/api/auth/login".equalsIgnoreCase(path) || "/api/auth/login/".equalsIgnoreCase(path)) && "POST".equalsIgnoreCase(method)) {
                    handleLogin(exchange);
                    return;
                }

                if (("/api/users".equalsIgnoreCase(path) || "/api/users/".equalsIgnoreCase(path)) && "GET".equalsIgnoreCase(method)) {
                    List<Models.User> users = db.getUsers();
                    List<Map<String, Object>> out = new ArrayList<>();
                    for (Models.User u : users) out.add(u.toMap());
                    sendJson(exchange, 200, out);
                    return;
                }

                if (("/api/drivers".equalsIgnoreCase(path) || "/api/drivers/".equalsIgnoreCase(path)) && "GET".equalsIgnoreCase(method)) {
                    List<Models.Driver> drivers = db.getDrivers();
                    List<Map<String, Object>> out = new ArrayList<>();
                    for (Models.Driver d : drivers) out.add(d.toMap());
                    sendJson(exchange, 200, out);
                    return;
                }

                if (path.startsWith("/api/drivers/") && "GET".equalsIgnoreCase(method)) {
                    String dId = path.substring("/api/drivers/".length());
                    if (dId.endsWith("/")) dId = dId.substring(0, dId.length() - 1);
                    Models.Driver d = db.getDriver(dId);
                    if (d == null) {
                        sendError(exchange, 404, "Driver not found: " + dId);
                    } else {
                        sendJson(exchange, 200, d.toMap());
                    }
                    return;
                }

                if (("/api/routes".equalsIgnoreCase(path) || "/api/routes/".equalsIgnoreCase(path)) && ("GET".equalsIgnoreCase(method) || "POST".equalsIgnoreCase(method))) {
                    handleCalculateRoute(exchange, method, queryParams);
                    return;
                }

                if ("/api/trips".equals(path) && "GET".equals(method)) {
                    handleListTrips(exchange, queryParams);
                    return;
                }

                if ("/api/reset".equals(path) && "POST".equals(method)) {
                    db.initDefaultState(true);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("status", "success");
                    resp.put("message", "System reset to sample state.");
                    sendJson(exchange, 200, resp);
                    return;
                }

                if ("/api/clean-session".equals(path) && "POST".equals(method)) {
                    db.clearTestIncidents();
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("status", "success");
                    resp.put("message", "All test incidents cleared. Ready for fresh registrations.");
                    sendJson(exchange, 200, resp);
                    return;
                }

                sendError(exchange, 404, "Route not found: " + path);

            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, "Internal Server Error: " + e.getMessage());
            }
        }

        // ==========================================
        // HANDLER IMPLEMENTATIONS
        // ==========================================

        private void handleDuplicateCheck(HttpExchange exchange) throws IOException {
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);
            double lat = getDouble(req, "latitude", 0.0);
            double lon = getDouble(req, "longitude", 0.0);
            String createdAt = req.containsKey("created_at") && req.get("created_at") != null
                    ? req.get("created_at").toString() : Instant.now().toString();
            double radiusMeters = getDouble(req, "radius_meters", 200.0);
            double timeWindowMins = getDouble(req, "time_window_minutes", 10.0);

            List<Models.Incident> activeInc = db.getIncidents(true);
            Models.DuplicateResult dup = Haversine.checkDuplicate(lat, lon, createdAt, activeInc, radiusMeters, timeWindowMins);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("is_duplicate", dup != null);
            resp.put("duplicate_data", dup != null ? dup.toMap() : null);
            sendJson(exchange, 200, resp);
        }

        private void handleRegisterIncident(HttpExchange exchange, Map<String, String> queryParams) throws IOException {
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);

            boolean bypassDup = "true".equalsIgnoreCase(queryParams.get("bypass_duplicate_check"));
            double lat = getDouble(req, "latitude", 0.0);
            double lon = getDouble(req, "longitude", 0.0);
            String nowIso = Instant.now().toString();

            if (!bypassDup) {
                List<Models.Incident> activeInc = db.getIncidents(true);
                Models.DuplicateResult dup = Haversine.checkDuplicate(lat, lon, nowIso, activeInc, 200.0, 10.0);
                if (dup != null) {
                    Map<String, Object> dupResp = new LinkedHashMap<>();
                    dupResp.put("status", "duplicate_detected");
                    dupResp.put("message", "Potential duplicate incident detected within 200m and 10 mins window.");
                    dupResp.put("duplicate_data", dup.toMap());
                    dupResp.put("incident", null);
                    sendJson(exchange, 200, dupResp);
                    return;
                }
            }

            String incId = db.generateNextIncidentId();

            Models.Incident inc = new Models.Incident();
            inc.id = incId;
            inc.callerPhone = getString(req, "caller_phone", "");
            inc.callerName = getString(req, "caller_name", "Anonymous Caller");
            inc.locationName = getString(req, "location_name", "Unknown Location");
            inc.latitude = lat;
            inc.longitude = lon;
            inc.incidentType = getString(req, "incident_type", "Medical Emergency");
            inc.severity = getString(req, "severity", "High");
            inc.ambulancesRequired = getInt(req, "ambulances_required", 1);
            inc.status = "Registered";
            inc.createdAt = nowIso;
            inc.notes = getString(req, "notes", "");

            Models.CallerLog log = new Models.CallerLog();
            log.callerPhone = inc.callerPhone;
            log.callerName = inc.callerName;
            log.timestamp = nowIso;
            log.note = "Primary registration";
            inc.callerLogs.add(log);

            db.createIncident(inc);

            db.addNotification("New Call Registered: " + inc.id,
                    inc.incidentType + " at " + inc.locationName + " (Severity: " + inc.severity + ")",
                    "urgent");

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("message", "Incident " + inc.id + " successfully registered.");
            resp.put("incident", inc.toMap());
            sendJson(exchange, 200, resp);
        }

        private void handleLinkCall(HttpExchange exchange, String incId) throws IOException {
            Models.Incident inc = db.getIncident(incId);
            if (inc == null) {
                sendError(exchange, 404, "Incident not found");
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);

            String callerPhone = getString(req, "caller_phone", "");
            String callerName = getString(req, "caller_name", "");
            String notes = getString(req, "notes", "");
            String nowIso = Instant.now().toString();

            Models.CallerLog log = new Models.CallerLog();
            log.callerPhone = callerPhone;
            log.callerName = callerName;
            log.timestamp = nowIso;
            log.note = "Linked call: " + (notes.isEmpty() ? "Duplicate caller corroborating incident" : notes);
            inc.callerLogs.add(log);

            if (!notes.isEmpty()) {
                inc.notes = (inc.notes.isEmpty() ? "" : inc.notes + " | ") + "Linked Call from " + callerPhone + ": " + notes;
            }
            inc.duplicateCallsCount++;

            Map<String, Object> updates = new LinkedHashMap<>();
            updates.put("notes", inc.notes);
            updates.put("duplicate_calls_count", inc.duplicateCallsCount);
            List<Map<String, Object>> logsList = new ArrayList<>();
            for (Models.CallerLog cl : inc.callerLogs) logsList.add(cl.toMap());
            updates.put("caller_logs", logsList);
            db.updateIncident(incId, updates);

            db.addNotification("Call Linked to " + incId,
                    "Additional caller " + callerPhone + " linked to incident " + incId, "info");

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("message", "Call linked to " + incId);
            resp.put("incident", inc.toMap());
            sendJson(exchange, 200, resp);
        }

        private void handleCallForward(HttpExchange exchange) throws IOException {
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);

            String targetRoom = getString(req, "target_control_room", "Coimbatore Regional 108 Command");
            String callerPhone = getString(req, "caller_phone", "");
            String location = getString(req, "location_name", "");
            String incType = getString(req, "incident_type", "");
            String forwardId = "FWD-108-" + (System.currentTimeMillis() % 10000);
            String timestamp = Instant.now().toString();

            db.addNotification("Call Forwarded to " + targetRoom,
                    "Caller " + callerPhone + " (" + incType + " at " + location + ") rerouted. Operator busy.",
                    "urgent");

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "Forwarded");
            resp.put("forward_id", forwardId);
            resp.put("receiving_control_room", targetRoom);
            resp.put("caller_phone", callerPhone);
            resp.put("location", location);
            resp.put("timestamp", timestamp);
            resp.put("message", "Emergency call successfully forwarded to " + targetRoom + " (External Telephony Simulated).");
            sendJson(exchange, 200, resp);
        }

        private void handleRecommendAmbulance(HttpExchange exchange, String incId) throws IOException {
            Models.Incident inc = db.getIncident(incId);
            if (inc == null) {
                sendError(exchange, 404, "Incident not found");
                return;
            }

            List<Models.Ambulance> all = db.getAmbulances();
            List<Map<String, Object>> ranked = new ArrayList<>();

            for (Models.Ambulance a : all) {
                if ("Available".equalsIgnoreCase(a.status)) {
                    double distKm = Haversine.distanceKm(inc.latitude, inc.longitude, a.latitude, a.longitude);
                    double etaMins = Math.round(((distKm / 45.0) * 60.0 + 2.0) * 10.0) / 10.0;
                    if (etaMins < 3.0) etaMins = 3.0;

                    Map<String, Object> ambMap = a.toMap();
                    ambMap.put("distance_km", distKm);
                    ambMap.put("eta_minutes", etaMins);
                    ranked.add(ambMap);
                }
            }

            ranked.sort(Comparator.comparingDouble(m -> (Double) m.get("distance_km")));

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("incident", inc.toMap());
            resp.put("available_ambulances_count", ranked.size());
            resp.put("recommended_ambulance", ranked.isEmpty() ? null : ranked.get(0));
            resp.put("ranked_ambulances", ranked);
            if (ranked.isEmpty()) {
                resp.put("message", "No ambulances currently available in fleet.");
            }
            sendJson(exchange, 200, resp);
        }

        private void handleConfirmDispatch(HttpExchange exchange) throws IOException {
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);

            String incId = getString(req, "incident_id", "");
            String ambId = getString(req, "ambulance_id", "");

            Models.Incident inc = db.getIncident(incId);
            if (inc == null) {
                sendError(exchange, 404, "Incident not found");
                return;
            }
            Models.Ambulance amb = db.getAmbulance(ambId);
            if (amb == null) {
                sendError(exchange, 404, "Ambulance not found");
                return;
            }

            // Prevent a driver or ambulance already assigned to an active emergency from being assigned another one
            if (!"Available".equalsIgnoreCase(amb.status)) {
                sendError(exchange, 400, "Ambulance " + ambId + " (" + amb.driverName + ") is currently " + amb.status + " and cannot be dispatched.");
                return;
            }
            if (!"Registered".equalsIgnoreCase(inc.status) && !"Pending Dispatch".equalsIgnoreCase(inc.status)) {
                sendError(exchange, 400, "Incident " + incId + " is already in status '" + inc.status + "' and cannot be assigned again.");
                return;
            }

            String nowIso = Instant.now().toString();

            // Update Ambulance
            Map<String, Object> ambUpdates = new LinkedHashMap<>();
            ambUpdates.put("status", "Dispatched");
            ambUpdates.put("assigned_incident_id", inc.id);
            Map<String, Object> assignedIncData = new LinkedHashMap<>();
            assignedIncData.put("id", inc.id);
            assignedIncData.put("location_name", inc.locationName);
            assignedIncData.put("latitude", inc.latitude);
            assignedIncData.put("longitude", inc.longitude);
            assignedIncData.put("incident_type", inc.incidentType);
            assignedIncData.put("severity", inc.severity);
            assignedIncData.put("caller_phone", inc.callerPhone);
            assignedIncData.put("notes", inc.notes);
            ambUpdates.put("assigned_incident", assignedIncData);
            ambUpdates.put("dispatch_time", nowIso);
            Models.Ambulance updatedAmb = db.updateAmbulance(ambId, ambUpdates);

            // Update Incident
            Map<String, Object> incUpdates = new LinkedHashMap<>();
            incUpdates.put("status", "Dispatched");
            incUpdates.put("assigned_ambulance_id", ambId);
            Map<String, Object> ambDetails = new LinkedHashMap<>();
            ambDetails.put("vehicle_no", amb.vehicleNo);
            ambDetails.put("driver_name", amb.driverName);
            ambDetails.put("driver_phone", amb.driverPhone);
            incUpdates.put("assigned_ambulance_details", ambDetails);
            Models.Incident updatedInc = db.updateIncident(incId, incUpdates);

            db.addNotification("Dispatch Alert: " + ambId,
                    amb.vehicleNo + " dispatched to " + inc.locationName + " for " + inc.incidentType + ".",
                    "urgent");

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("message", "Ambulance " + ambId + " dispatched to incident " + incId + ".");
            resp.put("ambulance", updatedAmb.toMap());
            resp.put("incident", updatedInc.toMap());
            sendJson(exchange, 200, resp);
        }

        private void handleAmbulanceStatusToggle(HttpExchange exchange, String ambId) throws IOException {
            Models.Ambulance amb = db.getAmbulance(ambId);
            if (amb == null) {
                sendError(exchange, 404, "Ambulance not found");
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);
            String status = getString(req, "status", "Available");
            String notes = getString(req, "notes", "");

            Map<String, Object> updates = new LinkedHashMap<>();
            updates.put("status", status);
            updates.put("maintenance_notes", notes);
            Models.Ambulance updated = db.updateAmbulance(ambId, updates);

            db.addNotification("Fleet Update: " + ambId, "Status set to " + status + ".", "info");

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("ambulance", updated.toMap());
            sendJson(exchange, 200, resp);
        }

        private void handleDriverStatusUpdate(HttpExchange exchange) throws IOException {
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);

            String ambId = getString(req, "ambulance_id", "");
            String newStatus = getString(req, "status", "");
            String incId = getString(req, "incident_id", null);
            String selectedHospId = getString(req, "selected_hospital_id", null);

            Models.Ambulance amb = db.getAmbulance(ambId);
            if (amb == null) {
                sendError(exchange, 404, "Ambulance not found");
                return;
            }

            if (incId == null) incId = amb.assignedIncidentId;
            Models.Incident inc = incId != null ? db.getIncident(incId) : null;
            String nowIso = Instant.now().toString();

            Map<String, Object> updates = new LinkedHashMap<>();
            updates.put("status", newStatus);

            if (req.containsKey("current_latitude") && req.get("current_latitude") instanceof Number) {
                updates.put("latitude", ((Number) req.get("current_latitude")).doubleValue());
            }
            if (req.containsKey("current_longitude") && req.get("current_longitude") instanceof Number) {
                updates.put("longitude", ((Number) req.get("current_longitude")).doubleValue());
            }
            if (selectedHospId != null) {
                updates.put("target_hospital_id", selectedHospId);
            }

            // Handle Trip Completion
            boolean isCompleted = "Completed".equalsIgnoreCase(newStatus) || "Trip Completed".equalsIgnoreCase(newStatus);
            if (isCompleted) {
                String hospId = selectedHospId != null ? selectedHospId : (amb.targetHospitalId != null ? amb.targetHospitalId : "ERODE-HOSP-01");
                Models.Hospital targetHosp = db.getHospital(hospId);
                String hospName = targetHosp != null ? targetHosp.name : "Govt Medical College Hospital & IRT, Perundurai";

                if (inc != null) {
                    Map<String, Object> incUp = new LinkedHashMap<>();
                    incUp.put("status", "Completed");
                    incUp.put("completed_at", nowIso);
                    incUp.put("target_hospital_id", hospId);
                    incUp.put("target_hospital_name", hospName);
                    db.updateIncident(inc.id, incUp);
                }

                Models.Trip trip = new Models.Trip();
                trip.tripId = db.generateNextTripId();
                trip.incidentId = inc != null ? inc.id : "INC-UNKNOWN";
                trip.incidentType = inc != null ? inc.incidentType : "Medical Emergency";
                trip.ambulanceId = amb.id;
                trip.vehicleNo = amb.vehicleNo;
                trip.driverName = amb.driverName;
                trip.callerPhone = inc != null ? inc.callerPhone : "N/A";
                trip.patientLocation = inc != null ? inc.locationName : "Perundurai/Erode";
                trip.hospitalName = hospName;
                trip.dispatchTime = amb.dispatchTime != null ? amb.dispatchTime : nowIso;
                trip.completionTime = nowIso;
                trip.durationMinutes = 25;
                trip.distanceKm = 7.2;
                trip.outcome = "Patient transported safely to hospital care unit.";
                db.createTrip(trip);

                // Reset ambulance to Available only if operational (not in maintenance)
                if ("Maintenance".equalsIgnoreCase(amb.status)) {
                    updates.put("status", "Maintenance");
                } else {
                    updates.put("status", "Available");
                }
                updates.put("assigned_incident_id", null);
                updates.put("assigned_incident", null);
                updates.put("target_hospital_id", null);

                // Add trip completed notification with type 'trip_completed' for control room timer
                db.addNotification("Trip Completed",
                        amb.vehicleNo + " (Driver: " + amb.driverName + ") successfully completed trip to " + hospName + ". Ambulance is now Available.",
                        "trip_completed");
            } else {
                if (inc != null) {
                    Map<String, Object> incUp = new LinkedHashMap<>();
                    incUp.put("status", newStatus);
                    db.updateIncident(inc.id, incUp);
                }

                if ("En Route to Scene".equalsIgnoreCase(newStatus)) {
                    db.addNotification("Ambulance Dispatched & Driver Accepted",
                            "Driver " + amb.driverName + " (" + amb.vehicleNo + ") has accepted the dispatch for " + (inc != null ? inc.id : "Incident") + "!",
                            "driver_accepted");
                } else {
                    db.addNotification("Driver Update: " + amb.vehicleNo,
                            "Driver status changed to '" + newStatus + "'.", "info");
                }
            }

            Models.Ambulance updatedAmb = db.updateAmbulance(ambId, updates);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("ambulance", updatedAmb.toMap());
            resp.put("driver_status", newStatus);
            resp.put("is_completed", isCompleted);
            sendJson(exchange, 200, resp);
        }

        private void handleHospitalRecommend(HttpExchange exchange, String incId, boolean requireIcu) throws IOException {
            Models.Incident inc = db.getIncident(incId);
            if (inc == null) {
                sendError(exchange, 404, "Incident not found");
                return;
            }

            List<Models.Hospital> all = db.getHospitals();
            List<Map<String, Object>> scored = new ArrayList<>();

            for (Models.Hospital h : all) {
                boolean bedsOk = h.emergencyBeds > 0;
                if (requireIcu || "High".equalsIgnoreCase(inc.severity)) {
                    bedsOk = bedsOk && (h.icuBeds > 0);
                }
                double distKm = Haversine.distanceKm(inc.latitude, inc.longitude, h.latitude, h.longitude);
                double etaMins = Math.round(((distKm / 40.0) * 60.0) * 10.0) / 10.0;
                if (etaMins < 3.0) etaMins = 3.0;

                Map<String, Object> hm = h.toMap();
                hm.put("distance_km", distKm);
                hm.put("eta_minutes", etaMins);
                hm.put("beds_available", bedsOk);
                scored.add(hm);
            }

            // Sort: available beds first, then distance
            scored.sort((a, b) -> {
                boolean bA = (Boolean) a.get("beds_available");
                boolean bB = (Boolean) b.get("beds_available");
                if (bA != bB) return bA ? -1 : 1;
                return Double.compare((Double) a.get("distance_km"), (Double) b.get("distance_km"));
            });

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("incident", inc.toMap());
            resp.put("recommended_hospital", scored.isEmpty() ? null : scored.get(0));
            resp.put("all_hospitals", scored);
            sendJson(exchange, 200, resp);
        }

        private void handleHospitalBedUpdate(HttpExchange exchange, String hospId) throws IOException {
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);

            int er = getInt(req, "emergency_beds", 0);
            int icu = getInt(req, "icu_beds", 0);
            int o2 = getInt(req, "oxygen_beds", 0);

            Models.Hospital updated = db.updateHospitalBeds(hospId, er, icu, o2);
            if (updated == null) {
                sendError(exchange, 404, "Hospital not found");
                return;
            }

            db.addNotification("Bed Update: " + updated.name,
                    "Emergency: " + er + ", ICU: " + icu + ", Oxygen: " + o2, "info");

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("hospital", updated.toMap());
            sendJson(exchange, 200, resp);
        }

        private void handleGetHospitalBeds(HttpExchange exchange, String hospId) throws IOException {
            Models.Hospital h = db.getHospital(hospId);
            if (h == null) {
                sendError(exchange, 404, "Hospital not found");
                return;
            }
            Map<String, Object> beds = new LinkedHashMap<>();
            beds.put("hospital_id", h.id);
            beds.put("hospital_name", h.name);
            beds.put("emergency_beds", h.emergencyBeds);
            beds.put("icu_beds", h.icuBeds);
            beds.put("oxygen_beds", h.oxygenBeds);
            beds.put("total_beds", h.totalBeds);
            sendJson(exchange, 200, beds);
        }

        private void handleLogin(HttpExchange exchange) throws IOException {
            String body = readBody(exchange);
            Map<String, Object> req = JsonUtil.parseMap(body);

            String username = getString(req, "username", "");
            if (username.isEmpty()) username = getString(req, "identifier", "");
            if (username.isEmpty()) username = getString(req, "ambulance_id", "");
            if (username.isEmpty()) username = getString(req, "hospital_id", "");

            String password = getString(req, "password", "");
            String role = getString(req, "role", "");

            Map<String, Object> user = db.authenticateUser(username, password, role);
            if (user == null) {
                sendError(exchange, 401, "Invalid credentials or unauthorized role access.");
                return;
            }

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("message", "Authentication successful.");
            resp.put("token", "cad-token-" + System.currentTimeMillis());
            resp.put("user", user);
            sendJson(exchange, 200, resp);
        }

        private void handleCalculateRoute(HttpExchange exchange, String method, Map<String, String> queryParams) throws IOException {
            double startLat = 0, startLon = 0, endLat = 0, endLon = 0;
            if ("GET".equals(method)) {
                startLat = getDouble(queryParams, "start_lat", 11.2780);
                startLon = getDouble(queryParams, "start_lon", 77.5840);
                endLat = getDouble(queryParams, "end_lat", 11.3410);
                endLon = getDouble(queryParams, "end_lon", 77.7280);
            } else {
                String body = readBody(exchange);
                Map<String, Object> req = JsonUtil.parseMap(body);
                startLat = getDouble(req, "start_lat", getDouble(req, "start_latitude", 11.2780));
                startLon = getDouble(req, "start_lon", getDouble(req, "start_longitude", 77.5840));
                endLat = getDouble(req, "end_lat", getDouble(req, "end_latitude", 11.3410));
                endLon = getDouble(req, "end_lon", getDouble(req, "end_longitude", 77.7280));
            }

            double distKm = Haversine.distanceKm(startLat, startLon, endLat, endLon);
            double etaMins = Math.round(((distKm / 45.0) * 60.0 + 2.0) * 10.0) / 10.0;
            if (etaMins < 3.0) etaMins = 3.0;

            List<List<Double>> waypoints = new ArrayList<>();
            waypoints.add(Arrays.asList(startLat, startLon));
            int steps = 6;
            for (int i = 1; i < steps; i++) {
                double fraction = (double) i / steps;
                double interpLat = startLat + (endLat - startLat) * fraction;
                double interpLon = startLon + (endLon - startLon) * fraction;
                double curveOffset = Math.sin(fraction * Math.PI) * 0.0032;
                waypoints.add(Arrays.asList(interpLat + curveOffset, interpLon - curveOffset * 0.45));
            }
            waypoints.add(Arrays.asList(endLat, endLon));

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "success");
            resp.put("start", Arrays.asList(startLat, startLon));
            resp.put("destination", Arrays.asList(endLat, endLon));
            resp.put("distance_km", distKm);
            resp.put("eta_minutes", etaMins);
            resp.put("route_coordinates", waypoints);
            sendJson(exchange, 200, resp);
        }

        private void handleListTrips(HttpExchange exchange, Map<String, String> queryParams) throws IOException {
            String ambId = queryParams.get("ambulance_id");
            String incType = queryParams.get("incident_type");
            String search = queryParams.get("search");

            List<Models.Trip> trips = db.getTrips();
            List<Map<String, Object>> out = new ArrayList<>();

            for (Models.Trip t : trips) {
                if (ambId != null && !ambId.equalsIgnoreCase(t.ambulanceId)) continue;
                if (incType != null && (t.incidentType == null || !t.incidentType.toLowerCase().contains(incType.toLowerCase()))) continue;
                if (search != null) {
                    String s = search.toLowerCase();
                    boolean match = (t.tripId != null && t.tripId.toLowerCase().contains(s))
                            || (t.incidentId != null && t.incidentId.toLowerCase().contains(s))
                            || (t.driverName != null && t.driverName.toLowerCase().contains(s))
                            || (t.hospitalName != null && t.hospitalName.toLowerCase().contains(s))
                            || (t.patientLocation != null && t.patientLocation.toLowerCase().contains(s));
                    if (!match) continue;
                }
                out.add(t.toMap());
            }
            sendJson(exchange, 200, out);
        }

        // ==========================================
        // HELPERS
        // ==========================================

        private String readBody(HttpExchange exchange) throws IOException {
            InputStream is = exchange.getRequestBody();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = is.read(buf)) != -1) {
                baos.write(buf, 0, n);
            }
            return baos.toString(StandardCharsets.UTF_8);
        }

        private void sendJson(HttpExchange exchange, int status, Object data) throws IOException {
            String json = JsonUtil.toJson(data);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(status, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private void sendError(HttpExchange exchange, int status, String msg) throws IOException {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("detail", msg);
            sendJson(exchange, status, err);
        }

        private Map<String, String> parseQueryParams(String query) {
            Map<String, String> map = new HashMap<>();
            if (query == null || query.isEmpty()) return map;
            String[] pairs = query.split("&");
            for (String pair : pairs) {
                int idx = pair.indexOf("=");
                if (idx > 0) {
                    try {
                        String k = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8.name());
                        String v = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8.name());
                        map.put(k, v);
                    } catch (Exception ignored) {}
                }
            }
            return map;
        }

        private String getString(Map<?, ?> m, String key, String def) {
            if (m == null) return def;
            Object v = m.get(key);
            return v != null ? v.toString() : def;
        }

        private double getDouble(Map<?, ?> m, String key, double def) {
            if (m == null) return def;
            Object v = m.get(key);
            if (v instanceof Number) return ((Number) v).doubleValue();
            if (v instanceof String) {
                try { return Double.parseDouble((String) v); } catch (Exception ignored) {}
            }
            return def;
        }

        private int getInt(Map<?, ?> m, String key, int def) {
            if (m == null) return def;
            Object v = m.get(key);
            if (v instanceof Number) return ((Number) v).intValue();
            if (v instanceof String) {
                try { return Integer.parseInt((String) v); } catch (Exception ignored) {}
            }
            return def;
        }
    }
}
