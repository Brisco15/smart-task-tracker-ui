import { TestBed } from '@angular/core/testing';

import { TimeTracking } from './time-tracking';

describe('TimeTracking', () => {
  let service: TimeTracking;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeTracking);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
