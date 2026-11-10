import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Keyed, in-memory, stale-while-revalidate cache for HTTP observables.
 *
 * There is no HTTP caching layer anywhere else in the frontend (no
 * shareReplay, resolvers, or store) — this is the first one, added so portal
 * dashboards can render instantly from the last-known value on re-entry
 * instead of flashing a zero-filled placeholder while refetching.
 */
@Injectable({ providedIn: 'root' })
export class TtlCacheService {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Observable<unknown>>();

  /**
   * - Fresh entry cached → emit it, complete, no request.
   * - Stale (or no) entry cached → emit the cached value immediately (if any),
   *   then emit the network value when it lands.
   * - A revalidation failure is swallowed if a cached value was already
   *   emitted; otherwise it propagates. Nothing is ever cached from an error.
   * - Concurrent callers for the same key share one in-flight request.
   */
  observe<T>(key: string, ttlMs: number, factory: () => Observable<T>): Observable<T> {
    const cached = this.entries.get(key) as CacheEntry<T> | undefined;
    const isFresh = !!cached && cached.expiresAt > Date.now();

    if (isFresh) {
      return new Observable<T>((subscriber) => {
        subscriber.next(cached!.value);
        subscriber.complete();
      });
    }

    const network = this.load(key, ttlMs, factory);

    if (!cached) {
      return network;
    }

    return new Observable<T>((subscriber) => {
      subscriber.next(cached.value);
      const sub = network.subscribe({
        next: (value) => subscriber.next(value),
        error: () => subscriber.complete(), // stale value already delivered; swallow the revalidation error
        complete: () => subscriber.complete(),
      });
      return () => sub.unsubscribe();
    });
  }

  /** Bypasses any cached/in-flight value and always issues a fresh request. */
  force<T>(key: string, ttlMs: number, factory: () => Observable<T>): Observable<T> {
    this.entries.delete(key);
    this.inFlight.delete(key);
    return this.load(key, ttlMs, factory);
  }

  /** Drops every cached entry (and in-flight load) whose key starts with `prefix`. */
  invalidate(prefix: string): void {
    for (const key of Array.from(this.entries.keys())) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
    for (const key of Array.from(this.inFlight.keys())) {
      if (key.startsWith(prefix)) this.inFlight.delete(key);
    }
  }

  /** Drops everything — call on logout so the next session never sees a stale cache. */
  clearAll(): void {
    this.entries.clear();
    this.inFlight.clear();
  }

  private load<T>(key: string, ttlMs: number, factory: () => Observable<T>): Observable<T> {
    const existing = this.inFlight.get(key) as Observable<T> | undefined;
    if (existing) return existing;

    // Bookkeeping lives in `tap`, upstream of `shareReplay`, so it runs
    // exactly once per network request no matter how many subscribers attach
    // — an eager internal `subscribe()` here would race the synchronous-error
    // case (the in-flight slot could be inserted after a same-tick delete)
    // and would double the request whenever a caller subscribes after an
    // error, since shareReplay reconnects on error (resetOnError) for any new
    // subscriber. Cache the resolved value; never cache an error.
    const shared = factory().pipe(
      tap({
        next: (value) => this.entries.set(key, { value, expiresAt: Date.now() + ttlMs }),
        error: () => this.inFlight.delete(key),
        complete: () => this.inFlight.delete(key),
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlight.set(key, shared);
    return shared;
  }
}
