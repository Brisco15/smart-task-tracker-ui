import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProjectDialog } from './edit-project-dialog';

describe('EditProjectDialog', () => {
  let component: EditProjectDialog;
  let fixture: ComponentFixture<EditProjectDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProjectDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProjectDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
