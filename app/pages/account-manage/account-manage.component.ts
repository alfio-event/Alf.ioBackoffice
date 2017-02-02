import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router"
import { Color } from "color";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";
import { View } from "ui/core/view";
import { Observable } from 'rxjs/Observable'

import { Account, EventConfiguration, EventConfigurationSelection } from "../../shared/account/account";
import { AccountService } from "../../shared/account/account.service";
import { ImageService } from "../../shared/image/image.service";
var barcodescanner = require("nativescript-barcodescanner");

@Component({
    selector: "account-manage",
    providers: [AccountService, ImageService],
    templateUrl: "pages/account-manage/account-manage.html",
    styleUrls: ["pages/account-manage/account-manage-common.css"],
})
export class AccountManageComponent implements OnInit {
    account: Account;
    events: Array<EventConfigurationSelection>;
    isLoading: boolean;

    constructor(private route: ActivatedRoute,
        private routerExtensions: RouterExtensions,
        private accountService: AccountService,
        private imageService: ImageService) { }

    ngOnInit() {
        this.isLoading = true;
        this.route.params.forEach((params: Params) => {
            let id = params['accountId'];
            console.log("AccountManageComponent accountId:", id);
            this.accountService.findAccountById(id).ifPresent(account => {
                this.account = account;
                this.accountService.loadEventsForAccount(this.account)
                    .subscribe(events => {
                        console.log("received events_");
                        this.events = events.map(e => {
                            let configuration = new EventConfigurationSelection(e, this.account.containsEvent(e.key));
                            this.imageService.fillWithImage(this.account.url, e, configuration);
                            return configuration;
                        });
                        this.isLoading = false;
                    }, error => {
                        console.log("error while loading events", error);
                        this.events = [];
                        this.isLoading = false;
                    });
            });
        });
    }

    hasEvents(): boolean {
        return this.events.length > 0;
    }

    onBackTap() {
        this.routerExtensions.back();
    }

    persistSelection() {
        this.accountService.updateEventsForAccount(this.account.getKey(), this.events.filter(e => e.selected).map(e => e.eventConfiguration));
        this.routerExtensions.navigate(["/"])
    }


    select(item: Account): void {
        /*let eventsSize = item.configurations.length;
        console.log("events size: ", eventsSize);
        if (eventsSize == 0) {
            this.routerExtensions.navigate(['/manage-account/', item.getKey()]);
        } else if (eventsSize == 1) {
            this.routerExtensions.navigate(['/event-detail/', item.getKey(), item.configurations[0].key]);
        } else {
            dialogs.action({
                message: "Select the event",
                cancelButtonText: "cancel",
                actions: item.configurations.map(e => e.name)
            }).then(result => {
                console.log("Dialog result: " + result)
            });
        }*/
    }

}