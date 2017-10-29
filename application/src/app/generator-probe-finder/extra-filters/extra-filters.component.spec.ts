import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraFiltersComponent } from './extra-filters.component';

describe('ExtraFiltersComponent', () => {
  let component: ExtraFiltersComponent;
  let fixture: ComponentFixture<ExtraFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtraFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtraFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
