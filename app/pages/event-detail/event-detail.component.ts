import { Component, ElementRef, ViewChild, Injectable, OnInit, ChangeDetectorRef } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { View } from "ui/core/view";
import { RadSideDrawer } from "nativescript-telerik-ui/sidedrawer";
import { Page } from "ui/page";
import { ActionItem } from "ui/action-bar";
import sideDrawerModule = require('nativescript-telerik-ui/sidedrawer');
import { Observable } from "data/observable";
import { RadSideDrawerComponent, SideDrawerType } from "nativescript-telerik-ui/sidedrawer/angular";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../shared/account/account.service";
import { ImageService } from "../../shared/image/image.service";
import { Account, EventConfiguration, EventWithImage } from "../../shared/account/account";

@Component({
    moduleId: module.id,
    selector: "event-detail",
    providers: [ImageService],
    templateUrl: 'event-detail.html',
    styleUrls: ['event-detail-common.css']
})
@Injectable()
export class EventDetailComponent implements OnInit {

    isLoading: boolean;
    account: Account;
    event: EventConfiguration;
    eventImage: string;

    constructor(private route: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private accountService: AccountService,
                private imageService: ImageService) {
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
                let event = this.account.configurations.filter(c => c.key === eventId)[0];
                this.imageService.getImage(account.url, event).subscribe(imgUrl => {
                    this.event = event;
                    this.eventImage = imgUrl;
                    this.isLoading = false;
                })
                
            });
        });        
    }


}