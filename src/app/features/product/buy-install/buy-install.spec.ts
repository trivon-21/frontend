import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BuyInstall } from './buy-install';

describe('BuyInstall', () => {
  let component: BuyInstall;
  let fixture: ComponentFixture<BuyInstall>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyInstall],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BuyInstall);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
