import heapq
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

SEVERITY_RANKS = {
    "High": 1,
    "Medium": 2,
    "Low": 3
}

def get_severity_rank(severity: str) -> int:
    return SEVERITY_RANKS.get(severity, 2)

def parse_timestamp_epoch(dt_str: str) -> float:
    """Parse ISO datetime string to epoch seconds for heap ordering."""
    if not dt_str:
        return datetime.now(timezone.utc).timestamp()
    clean_str = dt_str.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(clean_str)
        return dt.timestamp()
    except Exception:
        return datetime.now(timezone.utc).timestamp()

class IncidentPriorityQueue:
    """
    Min-Heap Priority Queue for Emergency Incidents.
    Prioritisation Rules:
    1. Emergency Severity: High (rank 1) > Medium (rank 2) > Low (rank 3).
    2. Waiting Time: If severities are equal, earlier registered incidents
       (smaller timestamp) have higher priority.
    """
    def __init__(self):
        # Items are stored as tuples: (severity_rank, created_timestamp, incident_id, incident_data)
        self._heap: List[tuple] = []
        self._entry_finder: Dict[str, tuple] = {}

    def push(self, incident: Dict[str, Any]) -> None:
        """Add or update an incident in the priority queue."""
        inc_id = incident["id"]
        severity_rank = get_severity_rank(incident.get("severity", "Medium"))
        created_epoch = parse_timestamp_epoch(incident.get("created_at", ""))
        
        # If incident already exists, remove it first
        if inc_id in self._entry_finder:
            self.remove(inc_id)

        entry = (severity_rank, created_epoch, inc_id, incident)
        self._entry_finder[inc_id] = entry
        heapq.heappush(self._heap, entry)

    def pop(self) -> Optional[Dict[str, Any]]:
        """Pop the highest priority incident."""
        while self._heap:
            severity_rank, created_epoch, inc_id, incident = heapq.heappop(self._heap)
            if inc_id in self._entry_finder:
                del self._entry_finder[inc_id]
                return incident
        return None

    def peek(self) -> Optional[Dict[str, Any]]:
        """Look at the highest priority incident without removing it."""
        while self._heap:
            severity_rank, created_epoch, inc_id, incident = self._heap[0]
            if inc_id in self._entry_finder:
                return incident
            heapq.heappop(self._heap)
        return None

    def remove(self, incident_id: str) -> bool:
        """Mark/remove an incident from the queue (e.g. after dispatch or completion)."""
        if incident_id in self._entry_finder:
            del self._entry_finder[incident_id]
            # Clean up the heap lazily or re-heapify
            self._heap = [e for e in self._heap if e[2] in self._entry_finder]
            heapq.heapify(self._heap)
            return True
        return False

    def get_ordered_list(self) -> List[Dict[str, Any]]:
        """Return all active incidents currently in the priority queue, sorted by priority."""
        sorted_entries = sorted(
            [e for e in self._heap if e[2] in self._entry_finder],
            key=lambda item: (item[0], item[1])
        )
        return [item[3] for item in sorted_entries]

    def size(self) -> int:
        return len(self._entry_finder)
