package com.ambulance108;

import java.time.Instant;
import java.util.*;

public class PriorityQueueService {

    public static class IncidentComparator implements Comparator<Models.Incident> {
        private int severityWeight(String s) {
            if (s == null) return 3;
            switch (s.trim().toLowerCase()) {
                case "high": return 1;
                case "medium": return 2;
                case "low": return 3;
                default: return 2;
            }
        }

        private long parseEpoch(String iso) {
            try {
                return Instant.parse(iso).toEpochMilli();
            } catch (Exception e) {
                return System.currentTimeMillis();
            }
        }

        @Override
        public int compare(Models.Incident a, Models.Incident b) {
            int wA = severityWeight(a.severity);
            int wB = severityWeight(b.severity);
            if (wA != wB) {
                return Integer.compare(wA, wB); // 1 comes before 2 comes before 3
            }
            // Earlier time comes first (smaller epoch timestamp)
            return Long.compare(parseEpoch(a.createdAt), parseEpoch(b.createdAt));
        }
    }

    public static Map<String, Object> buildPriorityQueueResponse(List<Models.Incident> pendingIncidents) {
        PriorityQueue<Models.Incident> heap = new PriorityQueue<>(10, new IncidentComparator());
        for (Models.Incident inc : pendingIncidents) {
            heap.offer(inc);
        }

        List<Map<String, Object>> orderedList = new ArrayList<>();
        Models.Incident topRecommendation = heap.peek();

        // Drain in priority order to get clean ordered list
        PriorityQueue<Models.Incident> copyHeap = new PriorityQueue<>(heap);
        while (!copyHeap.isEmpty()) {
            orderedList.add(copyHeap.poll().toMap());
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("total_queued", orderedList.size());
        resp.put("recommended_for_dispatch", topRecommendation != null ? topRecommendation.toMap() : null);
        resp.put("priority_queue", orderedList);
        return resp;
    }
}
