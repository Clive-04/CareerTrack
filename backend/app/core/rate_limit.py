from collections import defaultdict, deque
from hashlib import sha256
from threading import Lock
from time import monotonic

from fastapi import HTTPException


class SlidingWindowLimiter:
    """Small in-process limiter; the deployment gateway remains the global limit."""

    def __init__(self):
        self._lock = Lock()
        self._attempts: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = monotonic()
        cutoff = now - window_seconds
        with self._lock:
            attempts = self._attempts[key]
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if len(attempts) >= limit:
                retry_after = max(1, int(attempts[0] + window_seconds - now) + 1)
                raise HTTPException(
                    429,
                    "Too many attempts. Please wait and try again.",
                    headers={"Retry-After": str(retry_after)},
                )
            attempts.append(now)

            stale_cutoff = now - 3600
            for stale_key in [
                item for item, values in self._attempts.items()
                if item != key and (not values or values[-1] <= stale_cutoff)
            ]:
                self._attempts.pop(stale_key, None)

    def reset(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._attempts.clear()


def private_identifier(value: str) -> str:
    return sha256(value.strip().casefold().encode("utf-8")).hexdigest()


auth_limiter = SlidingWindowLimiter()
