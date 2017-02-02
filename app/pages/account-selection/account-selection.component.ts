import { Component, ElementRef, OnInit, OnChanges, ViewChild, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";
import { RouterExtensions } from "nativescript-angular/router"
import dialogs = require("ui/dialogs");
import { Account, EventConfiguration } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import {AccountResponse} from "../../shared/account/account";
import { BARCODE_SCANNER, BarcodeScanner } from '../../utils/barcodescanner';

@Component({
    selector: "account-selection",
    templateUrl: "pages/account-selection/account-selection.html",
    styleUrls: ["pages/account-selection/account-selection-common.css"],
})
export class AccountSelectionComponent implements OnInit, OnChanges {
    accounts: Array<Account> = [];
    isLoading: boolean;
    displayEventSelection: boolean = false;

    constructor(private router: Router, 
        private accountService: AccountService, 
        private page: Page, 
        private routerExtensions: RouterExtensions,
        @Inject(BARCODE_SCANNER) private barcodeScanner: BarcodeScanner) {
        console.log("init completed. Loaded " + this.accounts.length + " accounts");
        console.log(JSON.stringify(this.accounts));
    }

    ngOnInit() {
        console.log("ngOnInit AccountSelection");
        this.accounts = this.accountService.getRegisteredAccounts();
        this.page.actionBarHidden = true;
        this.isLoading = false;
    }

    ngOnChanges() {
        console.log("ngOnChanges");
    }

    hasAccounts(): boolean {
        return this.accounts.length > 0;
    }

    requestQrScan() {
        this.isLoading = true;
        this.barcodeScanner.scan({
            formats: "QR_CODE",   // Pass in of you want to restrict scanning to certain types
            cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
            message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
            showFlipCameraButton: false,   // default false
            preferFrontCamera: false,     // default false
            showTorchButton: true,        // iOS only, default false
            orientation: "portrait",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
            openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
        }).then((result) => {
            this.isLoading = true;
            let scanResult = JSON.parse(result.text);
            this.accountService.registerNewAccount(scanResult.baseUrl, scanResult.username, scanResult.password)
                .subscribe(resp => this.processResponse(resp), () => {
                    alert("error")
                    this.isLoading = false;
                });

        }, (error) => {
            console.log("No scan: " + error);
            this.isLoading = false;
        });
    }

    manage(item: Account): void {
        this.routerExtensions.navigate(['/manage-account/', item.getKey()]);
    }

    private processResponse(accountResponse: AccountResponse) {
        console.log("success!");
        if (!accountResponse.isExisting()) {
            console.log("pushing itemResult", JSON.stringify(this.accounts));
            this.accounts.push(accountResponse.getAccount());
            console.log("done. current list size: " + this.accounts.length);
        }
        this.isLoading = false;
        this.manage(accountResponse.getAccount());
    }

}