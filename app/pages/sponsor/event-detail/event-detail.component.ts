import { defaultScanOptions } from '../../../utils/barcodescanner';
import { SponsorScan } from '../../../shared/scan/sponsor-scan';
import { Component, ElementRef, Injectable, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { ListView } from "ui/list-view"
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { SponsorScanService } from "../../../shared/scan/sponsor-scan.service"
import { Account, EventConfiguration } from "../../../shared/account/account";
import * as Toast from 'nativescript-toast';
import { Vibrate } from 'nativescript-vibrate';
import * as Email from "nativescript-email";
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { encodeBase64 } from '~/utils/network-util';
import { forcePortraitOrientation, enableRotation } from '~/utils/orientation-util';
import { BarcodeFormat, MLKitScanBarcodesOnDeviceResult } from "nativescript-plugin-firebase/mlkit/barcodescanning";

@Component({
    moduleId: module.id,
    selector: "sponsor-event-detail",
    providers: [AccountService, SponsorScanService],
    templateUrl: 'event-detail.html',
    styleUrls: ['event-detail-common.css']
})
@Injectable()
export class SponsorEventDetailComponent implements OnInit, OnDestroy {

    isLoading: boolean;
    account: Account;
    event: EventConfiguration;
    scans: Array<SponsorScan> = [];
    private lastUpdate: number = 0;
    @ViewChild("list") listViewContainer: ElementRef;
    private listView: ListView;
    private vibrator = new Vibrate();
    private scanView = false;

    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                private barcodeScanner: BarcodeScanner,
                private sponsorScanService: SponsorScanService,
                private ngZone: NgZone) {
    }

    onBackTap(): void {
        this.routerExtensions.back();
    }

    ngOnInit(): void {
        this.scans = [];
        this.isLoading = true;
        this.route.params.subscribe((params: Params) => {
            console.log("params", params['accountId'], params['eventId'])
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.sponsorScanService.getForEvent(this.event.key, this.account).subscribe(list => {
                    console.log("received ", list.length);
                    this.ngZone.run(() => {
                        this.scans = list;
                        this.refreshListView();
                    });
                });
                let list = this.sponsorScanService.loadInitial(this.event.key);
                if(list) {
                    this.scans = list;
                }
                this.isLoading = false;
            });
        });
        forcePortraitOrientation();
    }

    onBarcodeScanResult(event: any): void {
        Toast.makeText("Scansione!!!", event.barcodes);
    }

    ngOnDestroy() {
        if(this.event && this.event.key) {
            this.sponsorScanService.destroyForEvent(this.event.key);
        }
        enableRotation();
    }

    requestQrScan() {
        this.scanView = !this.scanView;        
    }

    private toggleLoading(state: boolean): void {
        this.ngZone.run(() => this.isLoading = state);
    }

    forceUpload(): void {
        this.sponsorScanService.forceProcess(this.event.key, this.account);
    }

    //from http://stackoverflow.com/a/12646864
    shuffleArray<T>(array: Array<T>): void {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    shuffle(): void {
        this.shuffleArray(this.scans);
    }

    sendByEmail(): void {
        let file = encodeBase64(this.scans.map(s => s.code).join('\n'));
        Email.compose({
            subject: `Data for event ${this.event.name}`,
            body: `Here attached the scanned data from account ${this.account.username}`,
            to: [],
            attachments: [
                {
                    fileName: `${this.event.key}-attendees.txt`,
                    path: `base64://${file}`,
                    mimeType: 'text/plain'
                }],
            appPickerTitle: 'Compose with..' // for Android, default: 'Open with..'
        }).then(
            function() {
                console.log("Email composer closed");
            }, function(err) {
                console.log("Error: " + err);
            });
    }
    
    private refreshListView(): void {
        let view = this.getListView();
        if(view) {
            console.log("refreshing...");
            view.refresh();
        }
    }
    
    private getListView(): ListView {
        if(this.listView) {
            return this.listView;
        } else if(this.listViewContainer) {
            let container = <ListView>this.listViewContainer.nativeElement;
            this.listView = container;
            return this.listView;
        }
        return null;
    }


}