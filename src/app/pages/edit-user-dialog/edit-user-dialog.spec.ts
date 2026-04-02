import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditUserDialog } from './edit-user-dialog';

describe('EditUserDialog', () => {
  let component: EditUserDialog;
  let fixture: ComponentFixture<EditUserDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditUserDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(EditUserDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
