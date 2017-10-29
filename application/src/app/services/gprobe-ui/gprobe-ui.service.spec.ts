import { TestBed, inject } from '@angular/core/testing';

import { GprobeUiService } from './gprobe-ui.service';

describe('GprobeUiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GprobeUiService]
    });
  });

  it('should be created', inject([GprobeUiService], (service: GprobeUiService) => {
    expect(service).toBeTruthy();
  }));
});
