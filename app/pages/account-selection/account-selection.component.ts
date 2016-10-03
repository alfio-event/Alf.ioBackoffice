import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";

import { Account } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";

@Component({
    selector: "my-app",
    providers: [AccountService],
    templateUrl: "pages/account-selection/account-selection.html",
    styleUrls: [],
})
export class AccountSelectionComponent implements OnInit {
    accounts: Array<Account>;

    constructor(private router: Router, private accountService: AccountService, private page: Page) {
        this.accounts = accountService.getRegisteredAccounts();
    }

    ngOnInit() {
        this.page.actionBarHidden = true;        
    }
    
}