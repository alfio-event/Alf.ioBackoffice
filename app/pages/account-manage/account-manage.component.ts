import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router"
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";
import { Observable } from 'rxjs/Observable'

import { Account, EventConfiguration } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
var barcodescanner = require("nativescript-barcodescanner");

@Component({
    selector: "account-manage",
    providers: [AccountService],
    templateUrl: "pages/account-manage/account-manage.html",
    styleUrls: ["pages/account-manage/account-manage-common.css"],
})
export class AccountManageComponent implements OnInit {
    account: Account;
    events: Array<EventConfigurationSelection>;
    isLoading: boolean;

    constructor(private route: ActivatedRoute, private routerExtensions: RouterExtensions, private accountService: AccountService) {
    }

    ngOnInit() {
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            let id = params['accountId'];
            console.log("AccountManageComponent accountId:", id)
            this.account = this.accountService.findAccountById(id);
            this.accountService.loadEventsForAccount(this.account)
                .subscribe(events => {
                    console.log("received events");
                    this.events = events.map(e => new EventConfigurationSelection(e, this.account.containsEvent(e.key)));
                    this.isLoading = false;
                }, error => {
                    console.log("error while loading events", error);
                    this.events = [];
                    this.isLoading = false;
                })
        });
    }

    hasEvents(): boolean {
        return this.events.length > 0;
    }

    onBackTap() {
        this.routerExtensions.back();
    }

    persistSelection() {
        this.accountService.updateEventsForAccount(this.account, this.events.filter(e => e.selected).map(e => e.eventConfiguration));
    }

}

class EventConfigurationSelection {
    constructor(public eventConfiguration: EventConfiguration, public selected: boolean) { }
}