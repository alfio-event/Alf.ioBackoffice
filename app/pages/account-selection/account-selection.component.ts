import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";
import { RouterExtensions } from "nativescript-angular/router"

import { Account, EventConfiguration } from "../../shared/account/account";
import { AccountService, AccountResponse } from "../../shared/account/account.service";
var barcodescanner = require("nativescript-barcodescanner");

@Component({
    selector: "account-selection",
    providers: [AccountService],
    templateUrl: "pages/account-selection/account-selection.html",
    styleUrls: ["pages/account-selection/account-selection-common.css"],
})
export class AccountSelectionComponent implements OnInit {
    accounts: Array<Account> = [];
    isLoading: boolean;
    displayEventSelection: boolean = false;
    events: Array<EventConfiguration>;

    constructor(private router: Router, private accountService: AccountService, private page: Page, private routerExtensions: RouterExtensions) {
        this.accounts = accountService.getRegisteredAccounts();
        console.log("init completed. Loaded " + this.accounts.length + " accounts");
        console.log(JSON.stringify(this.accounts));
    }

    ngOnInit() {
        console.log("ngOnInit");
        this.page.actionBarHidden = true;
        this.isLoading = false;
    }

    hasAccounts(): boolean {
        return this.accounts.length > 0;
    }

    requestQrScan() {
        this.isLoading = true;
        barcodescanner.scan({
            formats: "QR_CODE",   // Pass in of you want to restrict scanning to certain types 
            cancelLabel: "Stop scanning", // iOS only, default 'Close' 
            message: "Scan your configuration QR-Code", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.' 
            preferFrontCamera: false,     // Android only, default false 
            showFlipCameraButton: true,   // Android only, default false (on iOS it's always available) 
            orientation: "portrait"      // Android only, optionally lock the orientation to either "portrait" or "landscape" 
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

    manage(item: Account) :void {
        this.routerExtensions.navigate(['/manage-account/', item.getKey()]);
    }

    private processResponse(accountResponse: AccountResponse) {
        console.log("success!");
        if(!accountResponse.isExisting()) {
            console.log("pushing itemResult", JSON.stringify(this.accounts));
            this.accounts.push(accountResponse.getAccount());
            console.log("done. current list size: " + this.accounts.length);
        }
        this.isLoading = false;
        this.manage(accountResponse.getAccount());
    }

}