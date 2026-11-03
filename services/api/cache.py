"""Small TTL dictionary. Callers hold their data lock through lookup/load/write."""
from copy import deepcopy
from time import monotonic


class TTLCache:
    def __init__(self, ttl=30, capacity=128):
        self.ttl = ttl
        self.capacity = capacity
        self._entries = {}

    def clear(self):
        self._entries.clear()

    def get_or_load(self, key, load):
        now = monotonic()
        self._entries = {key: entry for key, entry in self._entries.items()
                         if entry[0] > now}
        if key not in self._entries:
            value = load()  # Failures are never cached.
            if len(self._entries) >= self.capacity:
                del self._entries[next(iter(self._entries))]
            self._entries[key] = (monotonic() + self.ttl, value)
        return deepcopy(self._entries[key][1])
