package com.eventus.eventus.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class LoginAttemptService {
    public static final int MAX_ATTEMPTS = 5;
    public static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, Attempt> attempts = new HashMap<>();

    public synchronized long remainingLockMs(String email) {
        Attempt attempt = attempts.get(email);
        if (attempt == null) {
            return 0;
        }
        if (attempt.lockedUntil() == 0) {
            return 0;
        }

        long remaining = attempt.lockedUntil() - System.currentTimeMillis();
        if (remaining <= 0) {
            attempts.remove(email);
            return 0;
        }
        return remaining;
    }

    public synchronized long recordFailure(String email) {
        long now = System.currentTimeMillis();
        Attempt previous = attempts.get(email);
        if (previous != null && previous.lockedUntil() > now) {
            return previous.lockedUntil() - now;
        }

        int failures = previous == null ? 1 : previous.failures() + 1;
        if (failures >= MAX_ATTEMPTS) {
            long lockedUntil = now + LOCK_DURATION.toMillis();
            attempts.put(email, new Attempt(0, lockedUntil, Instant.now()));
            pruneOldAttempts(now);
            return LOCK_DURATION.toMillis();
        }

        attempts.put(email, new Attempt(failures, 0, Instant.now()));
        pruneOldAttempts(now);
        return 0;
    }

    public synchronized void recordSuccess(String email) {
        attempts.remove(email);
    }

    public synchronized void clear() {
        attempts.clear();
    }

    private void pruneOldAttempts(long now) {
        if (attempts.size() < 1000) {
            return;
        }
        long cutoff = now - LOCK_DURATION.toMillis();
        attempts.entrySet().removeIf(entry -> {
            Attempt attempt = entry.getValue();
            return attempt.lockedUntil() > 0
                    ? attempt.lockedUntil() <= now
                    : attempt.lastAttempt().toEpochMilli() < cutoff;
        });
    }

    private record Attempt(int failures, long lockedUntil, Instant lastAttempt) {
    }
}
