import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MessageService } from './message.service';
import { from, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getSummaryEncounters } from '../core';
import { MccEncounter } from '../core/types/mcc-types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EncounterService {

  private baseURL = '/summary/educations';

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient, private messageService: MessageService) { }
  // Current test data has 0 education summary, hence during testing, we have not match the mapping yet
  /** GET education summaries by subject id. Will 404 if id not found */
  getEncounters(id: string): Observable<MccEncounter[]> {
    return from(getSummaryEncounters(environment.sdsURL, environment.authURL, environment.sdsScope) as Promise<MccEncounter[]>).pipe(
      tap(_ => this.log(`fetched subject id=${id}`)),
      catchError(this.handleError<MccEncounter[]>(`getSubject id=${id}`))
    );
  }


  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a message with the MessageService */
  private log(message: string) {
    this.messageService.add(`contact-service: ${message}`);
  }

}
