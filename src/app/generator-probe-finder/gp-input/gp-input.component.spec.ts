import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GpInputComponent } from './gp-input.component';

describe('GpInputComponent', () => {
  let component: GpInputComponent;
  let fixture: ComponentFixture<GpInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GpInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GpInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
