package com.ambulance108;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

public class Haversine {
    private static final double EARTH_RADIUS_KM = 6371.0;

    public static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double lat1Rad = Math.toRadians(lat1);
        double lat2Rad = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0)
                + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return Math.round(EARTH_RADIUS_KM * c * 1000.0) / 1000.0;
    }

    public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        return Math.round(distanceKm(lat1, lon1, lat2, lon2) * 1000.0 * 10.0) / 10.0;
    }

    public static Models.DuplicateResult checkDuplicate(
            double newLat,
            double newLon,
            String newTimeIso,
            List<Models.Incident> activeIncidents,
            double radiusMeters,
            double timeWindowMinutes
    ) {
        Instant newTime;
        try {
            newTime = Instant.parse(newTimeIso);
        } catch (Exception e) {
            newTime = Instant.now();
        }

        for (Models.Incident inc : activeIncidents) {
            if ("Completed".equalsIgnoreCase(inc.status) || "Cancelled".equalsIgnoreCase(inc.status)) {
                continue;
            }

            Instant incTime;
            try {
                incTime = Instant.parse(inc.createdAt);
            } catch (Exception e) {
                incTime = Instant.now();
            }

            double timeDiffSec = Math.abs(newTime.getEpochSecond() - incTime.getEpochSecond());
            double timeDiffMin = timeDiffSec / 60.0;

            if (timeDiffMin <= timeWindowMinutes) {
                double distM = distanceMeters(newLat, newLon, inc.latitude, inc.longitude);
                if (distM <= radiusMeters) {
                    Models.DuplicateResult res = new Models.DuplicateResult();
                    res.isDuplicate = true;
                    res.existingIncidentId = inc.id;
                    res.incidentType = inc.incidentType;
                    res.locationName = inc.locationName;
                    res.distanceMeters = distM;
                    res.timeDiffMinutes = Math.round(timeDiffMin * 10.0) / 10.0;
                    res.currentStatus = inc.status;
                    res.callerPhone = inc.callerPhone;
                    return res;
                }
            }
        }
        return null;
    }
}
