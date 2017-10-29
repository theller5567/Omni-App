import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GpInputDiameterComponent } from './gp-input-diameter.component';

describe('GpInputDiameterComponent', () => {
  let component: GpInputDiameterComponent;
  let fixture: ComponentFixture<GpInputDiameterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GpInputDiameterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GpInputDiameterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
