import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../services/data.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MccEncounter } from '../core/types/mcc-types';
import moment from 'moment';

@Component({
  selector: 'app-encounter-list',
  templateUrl: './encounter-list.component.html',
  styleUrls: ['./encounter-list.component.css']
})
export class EncounterListComponent implements OnInit, AfterViewInit {
  encounterListDataSource: MatTableDataSource<MccEncounter>;

  constructor(public dataService: DataService, private dialog: MatDialog) {
  }

  //displayedColumns = ['reason'];
  displayedColumns = ['apptType', 'serviceType', 'startDateText', 'endDate', 'participant'];
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
