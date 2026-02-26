import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalQuestionnairesResultsComponent } from './clinical-questionnaires-results.component';

describe('ClinicalQuestionnairesResultsComponent', () => {
  let component: ClinicalQuestionnairesResultsComponent;
  let fixture: ComponentFixture<ClinicalQuestionnairesResultsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClinicalQuestionnairesResultsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClinicalQuestionnairesResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
