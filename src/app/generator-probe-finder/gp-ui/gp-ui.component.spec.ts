import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GpUiComponent } from './gp-ui.component';

describe('GpUiComponent', () => {
  let component: GpUiComponent;
  let fixture: ComponentFixture<GpUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GpUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GpUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
