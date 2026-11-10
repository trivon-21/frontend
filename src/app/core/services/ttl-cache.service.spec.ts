import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { TtlCacheService } from './ttl-cache.service';

describe('TtlCacheService', () => {
  let cache: TtlCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TtlCacheService] });
    cache = TestBed.inject(TtlCacheService);
  });

  it('a fresh cache hit emits synchronously with no new request', () => {
    let calls = 0;
    const factory = () => {
      calls += 1;
      return new Subject<string>().asObservable();
    };
    const priming = new Subject<string>();
    cache.observe('k', 1000, () => priming.asObservable()).subscribe();
    priming.next('cached-value');
    priming.complete();

    let value: string | undefined;
    cache.observe('k', 1000, factory).subscribe((v) => (value = v));

    expect(value).toBe('cached-value');
    expect(calls).toBe(0, 'a fresh hit must not invoke the factory');
  });

  it('a stale hit emits the cached value immediately, then the fresh value', () => {
    const first = new Subject<string>();
    cache.observe('k', 10, () => first.asObservable()).subscribe();
    first.next('old');
    first.complete();

    const emitted: string[] = [];
    const second = new Subject<string>();
    // Force staleness deterministically instead of waiting on a real timer.
    (cache as any).entries.get('k').expiresAt = Date.now() - 1;
    cache.observe('k', 10, () => second.asObservable()).subscribe((v) => emitted.push(v));

    expect(emitted).toEqual(['old']);
    second.next('fresh');
    second.complete();
    expect(emitted).toEqual(['old', 'fresh']);
  });

  it('concurrent observers for the same key share one in-flight request', () => {
    let calls = 0;
    const subject = new Subject<string>();
    const factory = () => { calls += 1; return subject.asObservable(); };

    const results: string[] = [];
    cache.observe('k', 1000, factory).subscribe((v) => results.push(v));
    cache.observe('k', 1000, factory).subscribe((v) => results.push(v));
    cache.observe('k', 1000, factory).subscribe((v) => results.push(v));

    subject.next('v');
    subject.complete();

    expect(calls).toBe(1);
    expect(results).toEqual(['v', 'v', 'v']);
  });

  it('an errored load with no cached value propagates the error and caches nothing', () => {
    let errored = false;
    cache.observe('k', 1000, () => throwError(() => new Error('boom'))).subscribe({
      error: () => (errored = true),
    });
    expect(errored).toBeTrue();

    let calls = 0;
    cache.observe('k', 1000, () => { calls += 1; return throwError(() => new Error('boom')); })
      .subscribe({ error: () => {} });
    expect(calls).toBe(1, 'nothing should have been cached from the failed load');
  });

  it('a revalidation error after a stale hit is swallowed; the cached value stands', () => {
    const first = new Subject<string>();
    cache.observe('k', 10, () => first.asObservable()).subscribe();
    first.next('old');
    first.complete();
    (cache as any).entries.get('k').expiresAt = Date.now() - 1;

    let sawError = false;
    let completed = false;
    const emitted: string[] = [];
    cache.observe('k', 10, () => throwError(() => new Error('boom'))).subscribe({
      next: (v) => emitted.push(v),
      error: () => (sawError = true),
      complete: () => (completed = true),
    });

    expect(emitted).toEqual(['old']);
    expect(sawError).toBeFalse();
    expect(completed).toBeTrue();
  });

  it('force bypasses any cached or in-flight value and always hits the factory', () => {
    const first = new Subject<string>();
    cache.observe('k', 1000, () => first.asObservable()).subscribe();
    first.next('old');
    first.complete();

    let calls = 0;
    const forced = new Subject<string>();
    let result: string | undefined;
    cache.force('k', 1000, () => { calls += 1; return forced.asObservable(); }).subscribe((v) => (result = v));
    forced.next('new');
    forced.complete();

    expect(calls).toBe(1);
    expect(result).toBe('new');
  });

  it('invalidate(prefix) drops only matching keys', () => {
    const a = new Subject<string>();
    const b = new Subject<string>();
    cache.observe('manager:dashboard', 1000, () => a.asObservable()).subscribe();
    a.next('d1'); a.complete();
    cache.observe('other:key', 1000, () => b.asObservable()).subscribe();
    b.next('o1'); b.complete();

    cache.invalidate('manager:');

    let managerCalls = 0;
    cache.observe('manager:dashboard', 1000, () => { managerCalls += 1; return new Subject<string>().asObservable(); }).subscribe();
    expect(managerCalls).toBe(1);

    let otherCalls = 0;
    cache.observe('other:key', 1000, () => { otherCalls += 1; return new Subject<string>().asObservable(); }).subscribe();
    expect(otherCalls).toBe(0, 'unrelated key must survive invalidation');
  });

  it('clearAll drops every cached and in-flight entry', () => {
    const a = new Subject<string>();
    cache.observe('k', 1000, () => a.asObservable()).subscribe();
    a.next('v'); a.complete();

    cache.clearAll();

    let calls = 0;
    cache.observe('k', 1000, () => { calls += 1; return new Subject<string>().asObservable(); }).subscribe();
    expect(calls).toBe(1);
  });
});
