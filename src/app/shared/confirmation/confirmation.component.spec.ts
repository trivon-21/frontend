import { TestBed } from '@angular/core/testing';
import { ConfirmationComponent } from './confirmation.component';
import { ConfirmService } from '../../services/confirm.service';

describe('ConfirmationComponent', () => {
  let confirmService: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmationComponent] });
    confirmService = TestBed.inject(ConfirmService);
  });

  function createFixture() {
    const fixture = TestBed.createComponent(ConfirmationComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders nothing when no confirmation is open', () => {
    const fixture = createFixture();
    expect(fixture.nativeElement.querySelector('.confirmation-modal')).toBeNull();
  });

  it('renders the dialog with title, message, and button labels once opened', () => {
    const fixture = createFixture();
    void confirmService.confirm({
      title: 'Discard unsaved changes?',
      message: 'Your product changes has not been saved.',
      confirmText: 'Discard',
      cancelText: 'Keep editing',
    });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.confirmation-modal')).not.toBeNull();
    expect(el.querySelector('h2')?.textContent).toContain('Discard unsaved changes?');
    expect(el.querySelector('.confirmation-body p')?.textContent).toContain('Your product changes has not been saved.');
    expect(el.querySelector('.btn-secondary')?.textContent).toContain('Keep editing');
    expect(el.querySelector('.btn-primary')?.textContent).toContain('Discard');
  });

  it('applies the danger styling hook only for a danger variant', () => {
    const fixture = createFixture();
    void confirmService.confirm({ message: 'Discard?', variant: 'danger' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.btn-primary.btn-danger')).not.toBeNull();
  });

  it('resolves true when the confirm button is clicked', async () => {
    const fixture = createFixture();
    const result = confirmService.confirm({ message: 'Proceed?' });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement).click();

    expect(await result).toBeTrue();
  });

  it('resolves false when the cancel button is clicked', async () => {
    const fixture = createFixture();
    const result = confirmService.confirm({ message: 'Proceed?' });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement).click();

    expect(await result).toBeFalse();
  });

  it('resolves false when Escape is pressed', async () => {
    const fixture = createFixture();
    const result = confirmService.confirm({ message: 'Proceed?' });
    fixture.detectChanges();
    fixture.componentInstance.onEscape();

    expect(await result).toBeFalse();
  });

  it('resolves false when the backdrop (not the dialog itself) is clicked', async () => {
    const fixture = createFixture();
    const result = confirmService.confirm({ message: 'Proceed?' });
    fixture.detectChanges();

    const overlay: HTMLElement = fixture.nativeElement.querySelector('.confirmation-overlay');
    fixture.componentInstance.onBackdropMouseDown({ target: overlay, currentTarget: overlay } as unknown as MouseEvent);

    expect(await result).toBeFalse();
  });
});
