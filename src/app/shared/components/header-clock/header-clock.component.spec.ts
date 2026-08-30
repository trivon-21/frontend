import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderClockComponent } from './header-clock.component';

describe('HeaderClockComponent', () => {
  let fixture: ComponentFixture<HeaderClockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderClockComponent],
    }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  it('renders the Super Admin time and date formats', () => {
    fixture = TestBed.createComponent(HeaderClockComponent);
    fixture.componentInstance.currentTime = new Date(2026, 7, 29, 13, 5, 9);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.clock-time')?.textContent?.trim()).toBe('1:05:09 PM');
    expect(root.querySelector('.clock-date')?.textContent?.trim()).toBe('Aug 29, 2026');
    expect(root.querySelector('.header-clock')?.getAttribute('aria-live')).toBe('off');
  });

  it('updates once per second', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(2026, 7, 29, 13, 5, 9));
      fixture = TestBed.createComponent(HeaderClockComponent);

      jasmine.clock().tick(1000);

      expect(fixture.componentInstance.currentTime.getSeconds()).toBe(10);
    } finally {
      fixture?.destroy();
      fixture = undefined as unknown as ComponentFixture<HeaderClockComponent>;
      jasmine.clock().uninstall();
    }
  });

  it('clears its interval when destroyed', () => {
    const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
    fixture = TestBed.createComponent(HeaderClockComponent);

    fixture.destroy();
    fixture = undefined as unknown as ComponentFixture<HeaderClockComponent>;

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
