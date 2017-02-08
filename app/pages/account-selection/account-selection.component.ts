import { Component, ElementRef, OnInit, OnChanges, ViewChild, Inject, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";
import { ListView } from "ui/list-view";
import { Observable, Subject} from "rxjs";
import { RouterExtensions } from "nativescript-angular/router"
import dialogs = require("ui/dialogs");
import { Account, EventConfiguration } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import {AccountResponse} from "../../shared/account/account";
import { BARCODE_SCANNER, BarcodeScanner, defaultScanOptions } from '../../utils/barcodescanner';
import application = require("application");

@Component({
    selector: "account-selection",
    templateUrl: "pages/account-selection/account-selection.html",
    styleUrls: ["pages/account-selection/account-selection-common.css", "pages/account-selection/account-selection.css"],
})
export class AccountSelectionComponent implements OnInit, OnChanges {
    accounts: Array<Account> = [];
    isLoading: boolean;
    isIos: boolean;
    editModeEnabled: boolean = false;
    tapEmitter = new Subject<Account>();
    private editEnableSubject = new Subject<boolean>();
    editEnableObservable: Observable<boolean> = this.editEnableSubject.asObservable();
    private tapObservable: Observable<Account> = this.tapEmitter.asObservable();
    private editedAccount?: Account = null;
    @ViewChild("list") listViewContainer: ElementRef;
    private listView: ListView;
    

    constructor(private router: Router, 
        private accountService: AccountService, 
        private page: Page, 
        private routerExtensions: RouterExtensions,
        @Inject(BARCODE_SCANNER) private barcodeScanner: BarcodeScanner) {
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
        })
    }

    ngOnChanges() {
        console.log("ngOnChanges");
    }

    hasAccounts(): boolean {
        return this.accounts.length > 0;
    }

    requestQrScan() {
        this.isLoading = true;
        if(this.editModeEnabled) {
            this.toggleEditMode();
        }
        this.barcodeScanner.scan(defaultScanOptions)
            .then((result) => {
                this.isLoading = true;
                let scanResult = JSON.parse(result.text);
                this.accountService.registerNewAccount(scanResult.baseUrl, scanResult.username, scanResult.password)
                    .subscribe(resp => this.processResponse(resp), () => {
                        alert("Cannot register a new Account. Please check your internet connection and retry.")
                        this.isLoading = false;
                    });

            }, (error) => {
                console.log("No scan: " + error);
                this.isLoading = false;
            });
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
        let newAccounts = this.accountService.deleteAccount(account);
        this.accounts = newAccounts;
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
        } else {
            let container = <ListView>this.listViewContainer.nativeElement;
            this.listView = container;
            return this.listView;
        }
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

}