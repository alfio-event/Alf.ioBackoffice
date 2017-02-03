import { BARCODE_SCANNER, BarcodeScanner, defaultScanOptions } from '../../utils/barcodescanner';
import { SponsorScan } from '../../shared/scan/sponsor-scan';
import { ChangeDetectorRef, Component, ElementRef, Inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { ActionItem } from "ui/action-bar";
import { Observable } from "data/observable";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../shared/account/account.service";
import { SponsorScanService } from "../../shared/scan/sponsor-scan.service"
import { Account, EventConfiguration, EventWithImage } from "../../shared/account/account";

@Component({
    moduleId: module.id,
    selector: "event-detail",
    providers: [AccountService, SponsorScanService],
    templateUrl: 'event-detail.html',
    styleUrls: ['event-detail-common.css']
})
@Injectable()
export class EventDetailComponent implements OnInit {

    isLoading: boolean;
    account: Account;
    event: EventConfiguration;
    scans: Array<SponsorScan>;

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
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            console.log("params", params['accountId'], params['eventId'])
            let id = params['accountId'];
            let eventId = params['eventId'];
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.sponsorScanService.getForEvent(this.event.key, this.account).subscribe(list => this.scans = list);
                this.isLoading = false;
            });
        });
        
    }

    requestQrScan() {
        this.isLoading = true;
        let scanOptions = defaultScanOptions;
        scanOptions.continuousScanCallback = (res) => {
            console.log("scanned", res.text);
            this.sponsorScanService.scan(this.event.key, res.text);
        }
        this.barcodeScanner.scan(defaultScanOptions)
            .then((result) => {
                this.isLoading = false;
            }, (error) => {
                console.log("No scan: " + error);
                this.isLoading = false;
            });
    }


}