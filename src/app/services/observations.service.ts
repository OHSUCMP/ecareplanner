import { Observation, QuestionnaireResponse } from 'fhir/r4';
import {
  getObservations as EccGetObservations,
  getObservation as EccGetObservation,
  getObservationsByValueSet as EccGetObservationsByValueSet,
  getQuestionnaireItem as EccGetQuestionnaireItem,
  getQuestionnaireItems as EccGetQuestionnaireItems,
  getObservationsByCategory as EccGetObservationsByCategory,
} from 'e-care-common-data-services';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Constants } from "../common/constants";
import { getDisplayValueNew, formatEffectiveDateNew } from "../util/utility-functions";

interface FormattedResult {
    name: string;
    value: string;
    date: any;
}

interface PatientLabResultsMap {
    name: string;
    value: string;
    type: string;
}

@Injectable()
export class ObservationsService {
    public HTTP_OPTIONS = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    public OBSERVATIONS: Map<string, any> = new Map<string, any>();
    public QUESTIONNAIRES: Map<string, any> = new Map<string, any>();

    _defaultUrl = environment.mccapiUrl;
  log: any;
    constructor(
        protected http: HttpClient
    ) {
    }

    _observationUrl = "find/latest/observation";
    getObservation(patientId: string, code: string, keyToStore?: string): Promise<any> {
        const key = patientId + "-" + code;

        if (this.OBSERVATIONS.has(key)) {
            let returnVal = this.OBSERVATIONS.get(key);
            return Promise.resolve(returnVal);
        }
        else {
            return EccGetObservation(code)
                .then((res: Observation) => {
                    this.OBSERVATIONS.set(key, res);
                    return res;
                }).catch((reason) => {
                    console.log("Error querying: " + "getObservation" + "?code=" + code);
                });
        }
    };

    _observationsUrl = "observations";
    getObservations(patientId: string, code: string, keyToStore?: string): Promise<any> {
        const key = patientId + "-" + code + "-multiple";

        if (this.OBSERVATIONS.has(key)) {
            let returnVal = this.OBSERVATIONS.get(key);
            if (keyToStore) {
                returnVal[0].key = keyToStore;
            }
            return Promise.resolve(this.OBSERVATIONS.get(key));
        }
        else {
            return EccGetObservations(code, 'code')
                .then((res: Observation[]) => {
                    this.OBSERVATIONS.set(key, res);
                    return res;
                }).catch((reason) => {
                    console.log("Error querying: " + `getObservation?subject=${patientId}&code=${code}&sort=descending`);
                });
        }
    };

    _observationByValueSetUrl = "observationsbyvalueset"
    getObservationsByValueSet = (patientId: string, valueSet: string, sort?: string, max?: string, keyToStore?: string): Promise<any> => {
        const key = patientId + "-" + valueSet + (sort ? "-" + sort : "") + (max ? "-" + max : "") + (keyToStore ? "-" + keyToStore : "");
        const url = `${environment.mccapiUrl}/${this._observationByValueSetUrl}?subject=${patientId}&valueset=${valueSet}` + (sort ? `&sort=${sort}` : ``) + (max ? `&max=${max}` : ``);

        if (this.OBSERVATIONS.has(key)) {
            let returnVal = this.OBSERVATIONS.get(key);
            if (returnVal.length > 0 && keyToStore) {
                returnVal[0].key = keyToStore;
            }
            return Promise.resolve(returnVal);
        }
        else {
            return EccGetObservationsByValueSet(valueSet, sort, max)
                .then((res: Observation[]) => {
                    this.OBSERVATIONS.set(key, res);
                    return res;
                }).catch((reason) => {
                    console.log("Error querying: " + url);
                });
        }
    }

    _observationsByPanelUrl = "observations"
    getObservationsByPanel(patientId: string, code: string, sort?: string, max?: string, keyToStore?: string): Promise<any> {
        const key = patientId + "-" + code + (sort ? "-" + sort : "") + (max ? "-" + max : "") + (keyToStore ? "-" + keyToStore : "");

        if (this.OBSERVATIONS.has(key)) {
            let returnVal = this.OBSERVATIONS.get(key);
            if (returnVal.length > 0 && keyToStore) {
                returnVal[0].key = keyToStore;
            }
            return Promise.resolve(returnVal);
        }
        else {
            return EccGetObservations(code, 'panel', sort, max)
                .then((res: Observation[]) => {
                    this.OBSERVATIONS.set(key, res);
                    return res;
                }).catch((reason) => {
                    console.log("Error querying: " + code);
                });
        }
    }

    _questionnaireLatestItemUrl = "find/latest/questionnaireresponseitem";
    getQuestionnaireItem(patientId: string, code: string): Promise<any> {
        const key = patientId + "-" + code;

        if (this.QUESTIONNAIRES.has(key)) {
            let returnVal = this.QUESTIONNAIRES.get(key);
            return Promise.resolve(returnVal);
        } else {
            return EccGetQuestionnaireItem(code)
                .then((res: QuestionnaireResponse) => {
                    this.QUESTIONNAIRES.set(key, res);
                    return res;
                }).catch((reason) => {
                    console.log("Error querying: " + code);
                });
        }
    }

    _questionnaireAllItemsUrl = "find/all/questionnaireresponseitems";
    getQuestionnaireItems(patientId: string, code: string): Promise<any> {
        const key = patientId + "-" + code + "-all";

        if (this.QUESTIONNAIRES.has(key)) {
            return Promise.resolve(this.QUESTIONNAIRES.get(key));
        } else {
            return EccGetQuestionnaireItems(code)
                .then((res: QuestionnaireResponse[]) => {
                    this.QUESTIONNAIRES.set(key, res);
                    return res;
                }).catch((reason) => {
                    console.log("Error querying: " + code);
                });
        }
    }

    getLabResults(patientId: string, longTermCondition: string): any {
        longTermCondition = "ckd";
        let results: FormattedResult[] = [];
        if (!Constants.labMappings[longTermCondition]) {
            return Promise.resolve([]);
        }
        let callsToMake: PatientLabResultsMap[] = Constants.labMappings[longTermCondition];
        let promiseArray = [];
        if (!callsToMake) return Promise.resolve([]);
        callsToMake.forEach((v, i) => {
            switch (v.type) {
                case "code":
                    promiseArray.push(this.getObservation(patientId, v.value, v.name));
                    break;
                case "valueset":
                  console.log("v.value"+v.name);
                  console.log("v.value"+v.name);
                  console.log("v.value"+v.name);
                  console.log("v.value"+v.name);
                  console.log("v.value"+v.value);
                    promiseArray.push(this.getObservationsByValueSet(patientId, v.value, "descending", "1", v.name));
                    break;
                case "panel":
                    promiseArray.push(this.getObservationsByPanel(patientId, v.value, "descending", "1", v.name));
                    break;
                case "question":
                    promiseArray.push(this.getQuestionnaireItem(patientId, v.value));
                    break;
            }
        })
        return Promise.all(promiseArray).then((resArr: any[]) => {
            resArr.forEach((res: any, index: number) => {
                let correspondingCall = callsToMake[index];
                if (!res || res.length < 1 || res.status === "notfound" || res.fhirid === "notfound") {
                    // results.push({ name: correspondingCall.name, value: "xxxNo Data Availablexxx", date: "" })
                }
                else {
                    switch (correspondingCall.type) {
                        case "code":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<Observation>res)), date: formatEffectiveDateNew((<Observation>res).effectiveDateTime) });
                            break;
                        case "valueset":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<Observation>res[0])), date: formatEffectiveDateNew((<Observation>res[0]).effectiveDateTime) });
                            break;
                        case "panel":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<Observation>res[0])), date: formatEffectiveDateNew((<Observation>res[0]).effectiveDateTime) });
                            break;
                        case "question":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<QuestionnaireResponse>res).item[0].answer[0] as Observation), date: formatEffectiveDateNew((<QuestionnaireResponse>res).authored) })
                            break;
                    }
                }
            });
            return results;
        });
    }

    _observationByCategoryURL= "observationsbycategory"
    getObservationsByCategory(subjectId: string, category: string): Promise<any> {

      return EccGetObservationsByCategory(category).then(res => {
        return res;
      }).catch(error => {
        console.error({error})
        console.log("Error querying: " + category);
      });
    }

    getVitalSignResults(patientId: string, longTermCondition: string): any {
        if (!longTermCondition || longTermCondition !== "general") longTermCondition = "ckd";
        let results: FormattedResult[] = [];
        if (!Constants.vitalMappings[longTermCondition]) {
            return Promise.resolve([]);
        }
        let callsToMake: PatientLabResultsMap[] = Constants.vitalMappings[longTermCondition];
        let promiseArray = [];
        if (!callsToMake) return Promise.resolve([]);
        callsToMake.forEach((v, i) => {
            switch (v.type) {
                case "code":
                    promiseArray.push(this.getObservation(patientId, v.value, v.name));
                    break;
                case "valueset":
                    promiseArray.push(this.getObservationsByValueSet(patientId, v.value, "descending", "1", v.name));
                    break;
                case "panel":
                    promiseArray.push(this.getObservationsByPanel(patientId, v.value, "descending", "1", v.name));
                    break;
                case "question":
                    promiseArray.push(this.getQuestionnaireItem(patientId, v.value));
                    break;
            }
        })
        return Promise.all(promiseArray).then((resArr: any[]) => {
            resArr.forEach((res: any, index: number) => {
                let correspondingCall = callsToMake[index];
                if (!res || res.length < 1 || res.status === "notfound" || res.fhirid === "notfound") {
                    // results.push({ name: correspondingCall.name, value: "No Data Available", date: "" })
                }
                else {
                    switch (correspondingCall.type) {
                        case "code":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<Observation>res)), date: formatEffectiveDateNew((<Observation>res).effectiveDateTime) });
                            break;
                        case "valueset":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<Observation>res[0])), date: formatEffectiveDateNew((<Observation>res[0]).effectiveDateTime) });
                            break;
                        case "panel":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<Observation>res[0])), date: formatEffectiveDateNew((<Observation>res[0]).effectiveDateTime) });
                            break;
                        case "question":
                            results.push({ name: correspondingCall.name, value: getDisplayValueNew((<QuestionnaireResponse>res).item[0].answer[0] as Observation), date: formatEffectiveDateNew((<QuestionnaireResponse>res).authored) })
                            break;
                    }
                }
            });
            return results;
        });
    }
}
