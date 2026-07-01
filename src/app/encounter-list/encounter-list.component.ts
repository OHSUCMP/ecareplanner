import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../services/data.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MccDocumentReference, MccEncounter } from '../core/types/mcc-types';
import { trigger, state, style, transition, animate } from '@angular/animations';
import moment from 'moment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';

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

  constructor(public dataService: DataService, private dialog: MatDialog, private sanitizer: DomSanitizer) {
  }

  displayedColumns: string[] = ['expand', 'apptType', 'participant', 'serviceType', 'startDateText', 'endDate'];
  expandedColumns: string[] = ['expandedDetail'];
  expandedEncounter: MccEncounter | null = null; // Explicitly null

  hasDocReferences = (index: number, row: MccEncounter) => {
    return row.docReferences && row.docReferences.length > 0;
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, html) || '';
  }

  openBinary(docRef: MccDocumentReference): void {
    try {
      const blobUrl = this.createBlobUrlFromBase64(
        docRef.content, 
        docRef.mimeType || 'application/octet-stream'
      );
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Unable to open document');
    }
  }
  
  downloadBinary(docRef: MccDocumentReference): void {
    try {
      const blobUrl = this.createBlobUrlFromBase64(
        docRef.content, 
        docRef.mimeType || 'application/octet-stream'
      );
      
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Create filename from type and date
      const extension = this.getFileExtension(docRef.mimeType);
      link.download = `${docRef.type.replace(/\s+/g, '-')}-${docRef.date}${extension}`;
      link.click();
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Unable to download document');
    }
  }
  
  private createBlobUrlFromBase64(base64Data: string, mimeType: string): string {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return URL.createObjectURL(blob);
  }
  
  private getFileExtension(mimeType?: string): string {
    if (!mimeType) return '';
    
    const mimeToExt: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'text/html': '.html',
      'text/plain': '.txt',
      'text/rtf': '.rtf',
      'application/rtf': '.rtf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/xml': '.xml',
      'text/xml': '.xml',
      'application/json': '.json'
    };
    
    return mimeToExt[mimeType.toLowerCase()] || '';
  }
  
  getDisplayLabel(docRef: MccDocumentReference): string {
    const mimeType = docRef.mimeType?.toLowerCase();
    
    if (mimeType?.includes('pdf')) return 'PDF Document';
    if (mimeType?.includes('image')) return 'Image';
    if (mimeType?.includes('rtf')) return 'RTF Document';
    
    return 'Document';
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
