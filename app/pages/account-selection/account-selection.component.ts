import { Component, ElementRef, OnInit, OnChanges, ViewChild, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { Page } from "ui/page";
import { ListView } from "ui/list-view";
import { RouterExtensions } from "nativescript-angular/router"
import { Account, ScannedAccount } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import { AccountResponse, Maybe, Some, Nothing } from "../../shared/account/account";
import { defaultScanOptions } from '../../utils/barcodescanner';
import application = require("application");
import { Vibrate } from 'nativescript-vibrate';
import * as Toast from 'nativescript-toast';
import { isUndefined, isDefined } from "utils/types";
import { BarcodeScanner, ScanResult } from "nativescript-barcodescanner";
import { Subject, Observable } from "rxjs";

@Component({
    selector: "account-selection",
    templateUrl: "pages/account-selection/account-selection.html",
    styleUrls: ["pages/account-selection/account-selection-common.css", "pages/account-selection/account-selection.css"],
})
export class AccountSelectionComponent implements OnInit, OnChanges {
    accounts: Array<Account> = [];
    isLoading: boolean;
    isIos: boolean;
    scannerVisible: boolean = false;
    editModeEnabled: boolean = false;
    tapEmitter = new Subject<Account>();
    private editEnableSubject = new Subject<boolean>();
    editEnableObservable: Observable<boolean> = this.editEnableSubject.asObservable();
    private tapObservable: Observable<Account> = this.tapEmitter.asObservable();
    private editedAccount: Account = null;
    @ViewChild("list") listViewContainer: ElementRef;
    private listView: ListView;
    private vibrator = new Vibrate();
    private qrCodeParts: Array<string>;
    

    constructor(private accountService: AccountService, 
        private routerExtensions: RouterExtensions,
        private barcodeScanner: BarcodeScanner,
        private ngZone: NgZone) {
            this.isIos = !application.android;
    }

    ngOnInit() {
        console.log("ngOnInit AccountSelection");
        this.accounts = this.accountService.getRegisteredAccounts();
        this.isLoading = false;
        this.tapObservable.subscribe(account => {
            if(this.editModeEnabled) {
                this.delete(account);
            } else {
                this.manage(account);
            }
        });
    }

    ngOnChanges() {
        console.log("ngOnChanges");
    }

    hasAccounts(): boolean {
        return this.accounts.length > 0;
    }

    onScanResult(result: ScanResult) {
        let splitQrCodeMatcher = /^(\d+):(\d+):(.+$)/;
        let text = <string>result.text;
        let matchResult = splitQrCodeMatcher.exec(text);
        this.vibrator.vibrate(50);
        let successFn = (account: ScannedAccount) => {
            this.ngZone.run(() => {
                this.registerNewAccount(account);
                this.scannerVisible = false;
            });
        };
        if(matchResult && matchResult.length == 4) {
            let length = +matchResult[2];
            if(!this.qrCodeParts) {
                this.qrCodeParts = new Array<string>(length).fill(undefined);
            }
            this.qrCodeParts[(+matchResult[1]) -1] = matchResult[3];
            if(this.qrCodeParts.length == length && this.qrCodeParts.every(v => v && v.length > 0)) {
                let maybeScannedAccount = this.parseScannedAccount(this.qrCodeParts);
                if(maybeScannedAccount.isPresent()) {
                    let account = maybeScannedAccount.value;
                    this.accountService.notifyAccountScan(account);
                    this.barcodeScanner.stop().then(() => successFn(account));
                } else {
                    this.qrCodeParts = new Array<string>(length).fill(undefined);
                    Toast.makeText("Corrupted QR-Code sequence. Please retry.").show();
                }
            } else {
                Toast.makeText("Please scan the next code").show();
            }
        } else {
            let maybeScannedAccount = this.parseScannedAccount([text]);
            if(maybeScannedAccount.isPresent()) {
                let account = maybeScannedAccount.value;
                this.accountService.notifyAccountScan(account);
                this.barcodeScanner.stop().then((() => successFn(account)));
            } else {
                Toast.makeText("Invalid QR-Code. Please retry.").show();
            }
        }
    }

    cancelScan(): void {
        this.barcodeScanner.stop().then(() => this.ngZone.run(() => this.scannerVisible = false));
    }

    requestQrScan(): void {
        if(this.editModeEnabled) {
            this.toggleEditMode();
        }

        if(this.isIos) {
            this.scannerVisible = true;
        } else {
            let scanOptions = defaultScanOptions();
            scanOptions.continuousScanCallback = (res) => this.onScanResult(res);
            scanOptions.closeCallback = () => {
                console.log("Scanner closed");
                this.ngZone.run(() => this.isLoading = false);
            };
            this.barcodeScanner.scan(scanOptions)
                .then(() => { }, (error) => {
                    console.log("No scan: " + error);
                    this.isLoading = false;
                });
        }
    }

    private registerNewAccount(account: ScannedAccount) {
        try {
            this.isLoading = true;
            this.accountService.registerNewAccount(account.url, account.apiKey, account.username, account.password, account.sslCert)
                .subscribe(resp => this.ngZone.run(() => {
                        this.processResponse(resp)
                    }), (err) => this.ngZone.run(() => {
                        console.log(err);
                        Toast.makeText("Cannot register a new Account. Please check your internet connection and retry.").show();
                        this.isLoading = false;
                    }));
        } catch(e) {
            console.log("error", e);
            Toast.makeText("Cannot register a new Account. Please re-scan the QR-Code(s).").show();
            this.isLoading = false;
        }
    }

    private parseScannedAccount(qrCodeParts: Array<string>): Maybe<ScannedAccount> {
        if(qrCodeParts.length >= 1 && qrCodeParts.every(v => v && v.length > 0)) {
            try {
                let scanResult = JSON.parse(qrCodeParts.join(""));
                if(isUndefined(scanResult.baseUrl) || [scanResult.username, scanResult.apiKey].every(isUndefined) || (isDefined(scanResult.username) && !isDefined(scanResult.password))) {
                    return new Nothing<ScannedAccount>();
                }
                return new Some<ScannedAccount>(new ScannedAccount(scanResult.baseUrl, scanResult.username, scanResult.apiKey, scanResult.password, scanResult.sslCert));
            } catch(e) {
                return new Nothing<ScannedAccount>();
            }
        }
    }

    manage(account: Account): void {
        if(this.isEditRequested(account)) {
            this.editedAccount = null;
        } else {
            this.routerExtensions.navigate(['/manage-account/', account.getKey()]);
        }
        
    }

    onLongPress(account: Account): void {
        this.editedAccount = account;
    }

    isEditRequested(account: Account): boolean {
        return this.editedAccount === account;
    }

    delete(account: Account): void {
        if(this.editModeEnabled || this.isEditRequested(account)) {
            let newAccounts = this.accountService.deleteAccount(account);
            this.accounts = newAccounts;
        }
    }
    
    toggleEditMode():void {
        this.editModeEnabled = !this.editModeEnabled;
        console.log('updated editModeEnabled to ', this.editModeEnabled);
        this.editEnableSubject.next(this.editModeEnabled);
        this.refreshListView();
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
   
    private processResponse(accountResponse: AccountResponse) {
        console.log("success!");
        if (!accountResponse.isExisting()) {
            console.log("pushing itemResult");
            this.accounts.push(accountResponse.getAccount());
            console.log("done. current list size: " + this.accounts.length);
        }
        this.isLoading = false;
    }
    
    isIosEditButtonVisible() {
        return this.isIos && this.hasAccounts() && !this.editModeEnabled;
    }
    
    isIosDoneButtonVisible() {
        return this.isIos && this.hasAccounts() && this.editModeEnabled;
    }

}