import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuyInstall } from './buy-install';

describe('BuyInstall', () => {
  let component: BuyInstall;
  let fixture: ComponentFixture<BuyInstall>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyInstall],
    }).compileComponents();

    fixture = TestBed.createComponent(BuyInstall);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
