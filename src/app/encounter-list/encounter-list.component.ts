import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../services/data.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MccEncounter } from '../core/types/mcc-types';
import { trigger, state, style, transition, animate } from '@angular/animations';
import moment from 'moment';

@Component({
  selector: 'app-encounter-list',
  templateUrl: './encounter-list.component.html',
  styleUrls: ['./encounter-list.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', visibility: 'visible', opacity: 1 })),
      transition('void => collapsed', [style({ height: '0px', minHeight: '0', visibility: 'hidden', opacity: 0 })]),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class EncounterListComponent implements OnInit, AfterViewInit {
  encounterListDataSource: MatTableDataSource<MccEncounter>;

  constructor(public dataService: DataService, private dialog: MatDialog) {
  }

  displayedColumns: string[] = ['expand', 'apptType', 'participant', 'serviceType', 'startDateText', 'endDate'];
  expandedColumns: string[] = ['expandedDetail'];
  expandedEncounter: MccEncounter | null = null; // Explicitly null

  hasDocReferences = (index: number, row: MccEncounter) => {
    return row.docReferences && row.docReferences.length > 0;
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {
    this.encounterListDataSource = this.dataService.encountersListDataSource;

    this.encounterListDataSource.sortingDataAccessor = (data: MccEncounter, header: string) => {
      switch (header) {
        case 'startDateText':
        case 'endDateText':
          return moment(data[header]).unix();
        default:
          return data[header];
      }
    };
  }

  ngAfterViewInit(): void {
    this.encounterListDataSource.paginator = this.paginator;
    this.encounterListDataSource.sort = this.sort;
  }

}
