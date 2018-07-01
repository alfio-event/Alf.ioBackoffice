import { Component, Injectable, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../../shared/account/account.service";
import { ScanService } from "../../../shared/scan/scan.service"
import { Account, EventConfiguration } from "../../../shared/account/account";
import { defaultScanOptions } from '../../../utils/barcodescanner';
import { TicketAndCheckInResult, CheckInStatus, statusDescriptions, UnexpectedError, Ticket } from '../../../shared/scan/scan-common'
import * as Toast from 'nativescript-toast';
import { Vibrate } from 'nativescript-vibrate';
import { BarcodeScanner } from 'nativescript-barcodescanner';
const { keepAwake, allowSleepAgain } = require("nativescript-insomnia");
import { forcePortraitOrientation, enableRotation } from '~/utils/orientation-util';

@Component({
    moduleId: module.id,
    selector: "staff-event-detail",
    providers: [AccountService, ScanService],
    templateUrl: 'event-detail.html',
    styleUrls: ['./event-detail.css']
})
@Injectable()
export class StaffEventDetailComponent implements OnInit, OnDestroy {

    isLoading: boolean = true;
    account: Account;
    event: EventConfiguration;
    code: string;
    status: CheckInStatus;
    message: string;
    detail: string;
    ticket: Ticket;
    private interval: number;
    private vibrator = new Vibrate();
    actionBarTitle: string;
    
    
    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                private barcodeScanner: BarcodeScanner,
                private scanService: ScanService,
                private ngZone: NgZone) {
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
                this.actionBarTitle = this.event.name;
                this.isLoading = false;
            });
        });
        keepAwake().then(v => console.log("keeping the screen awake..."));
        forcePortraitOrientation();
    }

    ngOnDestroy() {
        if(this.interval) {
            clearInterval(this.interval);
        }
        allowSleepAgain().then(v => console.log("allowed to sleep"));
        enableRotation();
    }

    onPrimaryButtonTap(): void {
        if(this.isStatusMustPay()) {
            this.confirmPayment(this.code);
        } else {
            this.scan();
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
                this.vibrator.vibrate(50);
                let scanResult = res.text;
                this.code = scanResult;
                let start = new Date().getTime();
                this.scanService.checkIn(this.event.key, this.account, scanResult)
                        .subscribe(res => {
                            this.displayResult(res);
                            console.log("2nd stop, elapsed", new Date().getTime() - start);
                        }, err => {
                            this.displayResult(new UnexpectedError(err));
                        }, () => this.ngZone.run(() => this.isLoading = false));
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
        this.isLoading = true;
        this.scanService.confirmPayment(this.event.key, this.account, code)
                    .subscribe(res => this.displayResult(res), err => {
                            this.displayResult(new UnexpectedError(err));
                        }, () => this.ngZone.run(() => this.isLoading = false));
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
            return "Scan Next";
        } else if (this.status == CheckInStatus.MUST_PAY) {
            return "Confirm Payment";
        } else {
            return "Rescan";
        }
    }

    private displayResult(res: TicketAndCheckInResult): void {
        this.ngZone.run(() => {
            this.status = res ? res.result.status : CheckInStatus.ERROR;
            this.message = statusDescriptions[this.status];
            if(this.status == CheckInStatus.MUST_PAY) {
                let formattedAmount = res.result.currency + res.result.dueAmount;
                this.message += " " + formattedAmount;
            }
            this.ticket = res ? res.ticket : null;
            if(this.status == CheckInStatus.SUCCESS) {
                //notify success
                this.vibrator.vibrate([50, 50, 50]);
            } else {
                this.vibrator.vibrate(500);
                //notify error
            }
        });
    }
}