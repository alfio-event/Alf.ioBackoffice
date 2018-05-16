import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";

import { SponsorScan, ScanStatus } from "./sponsor-scan";
import { Ticket } from "./scan-common";
import { authorization } from '../account/account.service';
import { Account } from "../account/account";

import * as AppSettings from 'application-settings';
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";

@Injectable()
export class SponsorScanService  {

    private sponsorScans: {[eventKey: string] : Array<SponsorScan>} = {};
    private sources: {[eventKey: string] : Subject<Array<SponsorScan>>} = {};
    private timeoutIds: {[eventKey: string] : number} = {};
    
    constructor(private http: Http) {
    }

    public scan(eventKey: string, account: Account, uuid: string) : void {
        if (!this.sponsorScans[eventKey]) {
            this.sponsorScans[eventKey] = [];
        }

        if(this.sponsorScans[eventKey].some(s => s.code === uuid)) {
            //already scanned
            return;
        }

        this.sponsorScans[eventKey].push(new SponsorScan(uuid, ScanStatus.NEW, null));
        this.persistSponsorScans(eventKey, account);
        this.emitFor(eventKey);
    }

    private persistSponsorScans(eventKey: string, account: Account) {
        if(this.sponsorScans[eventKey]) {
            AppSettings.setString('ALFIO_SPONSOR_SCANS_'+eventKey+account.getKey(), JSON.stringify(this.sponsorScans[eventKey]));
        }
    }

    private static fixStatusOnLoad(status: ScanStatus) : ScanStatus {
        if(status === ScanStatus.ERROR || status === ScanStatus.IN_PROCESS) {
            return ScanStatus.NEW;
        } else {
            return status;
        }
    }

    private loadIfExists(eventKey: string, account: Account): Array<SponsorScan> {
        let stringified = AppSettings.getString('ALFIO_SPONSOR_SCANS_'+eventKey+account.getKey(), null);
        if(stringified != null) {
            let found = <Array<SponsorScan>> JSON.parse(stringified);
            return found.map(sponsorScan => new SponsorScan(sponsorScan.code, SponsorScanService.fixStatusOnLoad(sponsorScan.status), sponsorScan.ticket));
        } else {
            return undefined;
        }
    }

    private findAllStatusNew(eventKey: string) : Array<SponsorScan> {
        if(!this.sponsorScans[eventKey]) {
            return [];
        }
        return this.sponsorScans[eventKey].filter(e => e.status == ScanStatus.NEW);
    }

    public destroyForEvent(eventKey: string) {
        if (this.timeoutIds[eventKey] !== undefined) {
            console.log('Clear timeout for event ' + eventKey);
            clearTimeout(this.timeoutIds[eventKey]);
            this.timeoutIds[eventKey] = undefined;
        }
    }

    public forceProcess(eventKey: string, account: Account) {
        this.process(eventKey, account, true);
    }

    private bulkScanUpload(eventKey: string, account: Account, toSend: Array<SponsorScan>) {
        return this.http.post(account.url+'/api/attendees/sponsor-scan/bulk', toSend.map(scan=> new SponsorScanRequest(eventKey, scan.code)), {
            headers: authorization(account.username, account.password)
        }).map(data => data.json()).subscribe(payload => {
            let a = <Array<any>> payload;
            a.forEach(scan => this.changeStatusFor(eventKey, (<Ticket> scan.ticket).uuid, ScanStatus.DONE, <Ticket> scan.ticket));
            this.persistSponsorScans(eventKey, account);
            this.emitFor(eventKey);
            this.process(eventKey, account);
        }, error => {
            toSend.forEach(scan => this.changeStatusFor(eventKey, scan.code, ScanStatus.ERROR, null));
            this.persistSponsorScans(eventKey, account);
            this.emitFor(eventKey);
            console.log('error while bulk scanning:', JSON.stringify(error));
            this.process(eventKey, account);
        });
        
    }

    private emitFor(eventKey) {
        this.sources[eventKey].next(this.sponsorScans[eventKey]);
    }

    private process(eventKey: string, account: Account, oneShot: boolean = false) {
        let toSend = this.findAllStatusNew(eventKey);
        if(toSend.length > 0) {
            toSend.forEach(scan => this.changeStatusFor(eventKey, scan.code, ScanStatus.IN_PROCESS, null));
            this.bulkScanUpload(eventKey, account, toSend);
        } else if(!oneShot) {
            this.doSetTimeoutProcess(eventKey, account);
        }
    }

    private changeStatusFor(eventKey: string, uuid: string, status: ScanStatus, ticket: Ticket) {
        this.sponsorScans[eventKey].filter(scan => scan.code === uuid).forEach(scan => {
            scan.status = status;
            if(ticket) {
                scan.ticket = ticket;
            }
        });
    }

    private doSetTimeoutProcess(eventKey: string, account: Account) {
        this.timeoutIds[eventKey] = setTimeout(() => {
            this.process(eventKey, account);
        }, 1000);

    }

    public getForEvent(eventKey: string, account: Account) : Observable<Array<SponsorScan>> {
        if(this.sources[eventKey]) {
            return this.sources[eventKey];
        }

        

        let subj = new Subject<Array<SponsorScan>>();
        this.sources[eventKey] = subj;

        let saved = this.loadIfExists(eventKey, account);
        if(saved) {
            this.sponsorScans[eventKey] = saved;
        }

        this.doSetTimeoutProcess(eventKey, account);

        return subj.asObservable();
    }

    public loadInitial(eventKey: string) : Array<SponsorScan> {
        return this.sponsorScans[eventKey];
    }
    
}

class SponsorScanRequest {
    constructor(private eventName: string, private ticketIdentifier: string){}
}