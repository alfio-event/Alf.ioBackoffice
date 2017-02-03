import { Injectable } from "@angular/core";
import { Observable, Subject } from 'rxjs';
import { SponsorScan } from "./sponsor-scan";

@Injectable()
export class SponsorScanService {
    

    public scan(eventKey: string, uuid: string) : void {
    }

    public getForEvent(eventKey: string) : Observable<Array<SponsorScan>> {
        let subj = new Subject<Array<SponsorScan>>();
        return subj.asObservable();
    }
}