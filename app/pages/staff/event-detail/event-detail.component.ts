import { ChangeDetectorRef, Component, ElementRef, Inject, Injectable, OnInit, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { ActionItem } from "ui/action-bar";
import { Observable } from "rxjs";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { ScanService } from "../../../shared/scan/scan.service"
import { Account, EventConfiguration, EventWithImage, Pair } from "../../../shared/account/account";
import { BARCODE_SCANNER, BarcodeScanner, defaultScanOptions } from '../../../utils/barcodescanner';
import { TicketAndCheckInResult, CheckInResult, CheckInStatus, statusDescriptions, UnexpectedError, Ticket } from '../../../shared/scan/scan-common'
import * as Toast from 'nativescript-toast';
import * as Vibrator from "nativescript-vibrate";

@Component({
    moduleId: module.id,
    selector: "staff-event-detail",
    providers: [AccountService, ScanService],
    templateUrl: 'event-detail.html',
    styleUrls: ['event-detail-common.css']
})
@Injectable()
export class StaffEventDetailComponent implements OnInit, OnDestroy {

    isLoading: boolean = true;
    account: Account;
    event: EventConfiguration;
    code: string;
    status: CheckInStatus;
    message: string;
    ticket: Ticket;
    private interval: number;
    
    
    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                @Inject(BARCODE_SCANNER) private barcodeScanner: BarcodeScanner,
                private scanService: ScanService) {
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
                this.isLoading = false;
            });
        });
        
    }

    ngOnDestroy() {
        if(this.interval) {
            clearInterval(this.interval);
        }
    }

    scan() {
        this.isLoading = true;
        let scanStart = new Date().getTime();
        this.barcodeScanner.scan(defaultScanOptions())
            .then((res) => {
                //let toast = Toast.makeText("Working...", 20000);
                this.isLoading = true;
                clearInterval(this.interval);
                Vibrator.vibration(50);
                let scanResult = res.text;
                let start = new Date().getTime();
                this.scanService.checkIn(this.event.key, this.account, scanResult)
                        .subscribe(res => {
                            this.displayResult(scanResult, res);
                            console.log("2nd stop, elapsed", new Date().getTime() - start);
                        }, err => {
                            this.displayResult("", new UnexpectedError(err));
                        }, () => {
                            this.isLoading = false;
                        });
            }, (error) => {
                console.log("handling scan error", error);
                clearInterval(this.interval);
                this.cancel();
            });

        let warningDisplayed = false;
        this.interval = setInterval(() => {
            let current = new Date().getTime();
            let elapsed = current - scanStart;
            if(elapsed > 45 * 1000) {
                clearInterval(this.interval);
                this.barcodeScanner.stop().then(() => Toast.makeText("Timed out").show());
            } else if(elapsed > (30 * 1000) && !warningDisplayed) {
                warningDisplayed = true;
                Toast.makeText("Camera will be deactivated in 15 sec.").show();
            }
        }, 1000);
    }

    confirmPayment(code: string): void {
        this.scanService.confirmPayment(this.event.key, this.account, code)
                    .subscribe(res => this.displayResult(code, res));
    }

    getStatusIcon(): string {
        if(this.isStatusSuccess()) {
            return String.fromCharCode(0xf269);
        } else if (this.status == CheckInStatus.MUST_PAY) {
            return String.fromCharCode(0xf19a);
        } else {
            return String.fromCharCode(0xf135);
        }
    }

    isStatusSuccess(): boolean {
        return this.status == CheckInStatus.SUCCESS;
    }

    isStatusMustPay(): boolean {
        return this.status == CheckInStatus.MUST_PAY;
    }

    cancel(): void {
        this.isLoading = false;
        this.ticket = undefined;
        this.status = undefined;
        this.code = undefined;
        this.message = undefined;
    }

    getPrimaryButtonText(): string {
        //Scan Attendees
        if(!this.status) {
            return "Scan Attendees";
        } else if(this.isStatusSuccess()) {
            return "Next";
        } else if (this.status == CheckInStatus.MUST_PAY) {
            return "Confirm Payment";
        } else {
            return "Rescan";
        }
    }

    private displayResult(code:string, res: TicketAndCheckInResult): void {
        this.status = res ? res.result.status : CheckInStatus.ERROR;
        this.message = statusDescriptions[this.status];
        this.ticket = res ? res.ticket : null;
        if(this.status == CheckInStatus.SUCCESS) {
            //notify success
            Vibrator.vibration(50);
        } else {
            Vibrator.vibration(500);
            //notify error
        }
    }
}