import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";

import { Account } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
var barcodescanner = require("nativescript-barcodescanner");

@Component({
    selector: "my-app",
    providers: [AccountService],
    templateUrl: "pages/account-selection/account-selection.html",
    styleUrls: ["pages/account-selection/account-selection-common.css"],
})
export class AccountSelectionComponent implements OnInit {
    accounts: Array<Account> = [];
    isLoading: boolean;

    constructor(private router: Router, private accountService: AccountService, private page: Page) {
        this.accounts = accountService.getRegisteredAccounts();
        console.log("init completed. Loaded "+ this.accounts.length + " accounts");
        console.log(JSON.stringify(this.accounts));
    }

    ngOnInit() {
        this.page.actionBarHidden = true;
        this.isLoading = false;
    }

    hasAccounts() : boolean {
        return this.accounts.length > 0;
    }

    requestQrScan() {
        this.isLoading = true;
        barcodescanner.scan({
            formats: "QR_CODE",   // Pass in of you want to restrict scanning to certain types 
            cancelLabel: "Stop scanning", // iOS only, default 'Close' 
            message: "Go scan something", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.' 
            preferFrontCamera: false,     // Android only, default false 
            showFlipCameraButton: true,   // Android only, default false (on iOS it's always available) 
            orientation: "portrait"      // Android only, optionally lock the orientation to either "portrait" or "landscape" 
        }).then((result) => {
                this.isLoading = true;
                let scanResult = JSON.parse(result.text);
                this.accountService.registerNewAccount(scanResult.baseUrl, scanResult.username, scanResult.password)
                    .subscribe((newItem) => {
                        console.log("success!");
                        if(newItem != null) {
                            console.log("pushing itemResult");
                            this.accounts.push(newItem);
                            console.log("done. current list size: "+this.accounts.length);
                        }
                        this.isLoading = false;
                    }, () => {
                        alert("error")
                        this.isLoading = false;
                    });
                
            },(error) => {
                console.log("No scan: " + error);
                this.isLoading = false;
            }
        );
    }

}