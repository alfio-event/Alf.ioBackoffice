import { BARCODE_SCANNER, BarcodeScanner, defaultScanOptions } from '../../../utils/barcodescanner';
import { SponsorScan } from '../../../shared/scan/sponsor-scan';
import { ChangeDetectorRef, Component, ElementRef, Inject, Injectable, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { ListView } from "ui/list-view"
import { ActionItem } from "ui/action-bar";
import { Observable } from "data/observable";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService, encodeBase64 } from "../../../shared/account/account.service";
import { SponsorScanService } from "../../../shared/scan/sponsor-scan.service"
import { Account, EventConfiguration, EventWithImage } from "../../../shared/account/account";
import * as Toast from 'nativescript-toast';
import * as Vibrator from "nativescript-vibrate";
import * as Email from "nativescript-email";

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

    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                @Inject(BARCODE_SCANNER) private barcodeScanner: BarcodeScanner,
                private sponsorScanService: SponsorScanService) {
    }

    onBackTap() {
        this.routerExtensions.back();
    }

    ngOnInit() {
        this.scans = [];
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            console.log("params", params['accountId'], params['eventId'])
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.sponsorScanService.getForEvent(this.event.key, this.account).subscribe(list => {
                    console.log("received ", list.length);
                    this.scans = list;
                    this.refreshListView();
                });
                let list = this.sponsorScanService.loadInitial(this.event.key);
                if(list) {
                    this.scans = list;
                }
                this.isLoading = false;
            });
        });
        
    }

    ngOnDestroy() {
        if(this.event && this.event.key) {
            this.sponsorScanService.destroyForEvent(this.event.key);
        }
    }

    requestQrScan() {
        this.isLoading = true;
        let scanOptions = defaultScanOptions;
        this.lastUpdate = new Date().getTime();
        scanOptions.continuousScanCallback = (res) => {
            this.lastUpdate = new Date().getTime();
            console.log("scanned", res.text);
            this.sponsorScanService.scan(this.event.key, this.account, res.text);
            Vibrator.vibration(250);
            Toast.makeText("Scan enqueued!").show();
        }
        this.barcodeScanner.scan(defaultScanOptions)
            .then((result) => {
                clearInterval(interval);
                this.isLoading = false;
            }, (error) => {
                console.log("No scan: " + error);
                this.isLoading = false;
            });
        let warningDisplayed = false;
        let interval = setInterval(() => {
            let current = new Date().getTime();
            let elapsed = current - this.lastUpdate;
            if(elapsed > 45 * 1000) {
                clearInterval(interval);
                this.barcodeScanner.stop()
                    .then(() => Toast.makeText("Timed out").show());
            } else if(elapsed > (30 * 1000) && !warningDisplayed) {
                warningDisplayed = true;
                Toast.makeText("Camera will be deactivated in 15 sec.").show();
            }
        }, 1000);
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
        } else {
            let container = <ListView>this.listViewContainer.nativeElement;
            this.listView = container;
            return this.listView;
        }
    }


}