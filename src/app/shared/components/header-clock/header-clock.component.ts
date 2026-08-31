import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-header-clock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-clock.component.html',
  styleUrl: './header-clock.component.css',
})
export class HeaderClockComponent implements OnDestroy {
  currentTime = new Date();
  private readonly clockInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly ngZone: NgZone,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.clockInterval = this.ngZone.runOutsideAngular(() =>
      setInterval(() => {
        this.ngZone.run(() => {
          this.currentTime = new Date();
          this.changeDetectorRef.markForCheck();
        });
      }, 1000),
    );
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
  }
}
