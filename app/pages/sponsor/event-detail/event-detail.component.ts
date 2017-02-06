import { BARCODE_SCANNER, BarcodeScanner, defaultScanOptions } from '../../../utils/barcodescanner';
import { SponsorScan } from '../../../shared/scan/sponsor-scan';
import { ChangeDetectorRef, Component, ElementRef, Inject, Injectable, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { ActionItem } from "ui/action-bar";
import { Observable } from "data/observable";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { SponsorScanService } from "../../../shared/scan/sponsor-scan.service"
import { Account, EventConfiguration, EventWithImage } from "../../../shared/account/account";
import * as Toast from 'nativescript-toast';
import * as Vibrator from "nativescript-vibrate";

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
                    console.log("received ", list.length)
                    this.scans = list
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

    shuffle(): void {
        this.scans.sort(() => 0.5 - Math.random());
    }


}