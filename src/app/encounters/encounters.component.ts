import { Component, OnInit } from '@angular/core';
import { Constants } from '../common/constants';
import { DataService } from '../services/data.service';
declare var window: any;

@Component({
  selector: 'app-encounters',
  templateUrl: './encounters.component.html',
  styleUrls: ['./encounters.component.css']
})
export class EncountersComponent implements OnInit {
  encounters: any[] = [];
  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

  getEncountersReady(): boolean {
    if (window[Constants.EncountersIsLoaded]) {
      this.encounters = this.dataService.encounters;
    }
    return window[Constants.EncountersIsLoaded];
  }

}

