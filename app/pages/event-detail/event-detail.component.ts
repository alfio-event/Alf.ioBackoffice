import { Component, ElementRef, ViewChild, Injectable, OnInit, ChangeDetectorRef } from "@angular/core";
import { View } from "ui/core/view";
import { RadSideDrawer } from "nativescript-telerik-ui/sidedrawer";
import { Page } from "ui/page";
import { ActionItem } from "ui/action-bar";
import sideDrawerModule = require('nativescript-telerik-ui/sidedrawer');
import { Observable } from "data/observable";
import { RadSideDrawerComponent, SideDrawerType } from "nativescript-telerik-ui/sidedrawer/angular";

@Component({
    moduleId: module.id,
    selector: "event-detail",
    templateUrl: 'event-detail.html',
    styleUrls: ['event-detail-common.css']
})
@Injectable()
export class EventDetailComponent extends Observable implements OnInit {
    constructor(private page: Page, private _changeDetectionRef: ChangeDetectorRef) {
        super();
    }

    @ViewChild(RadSideDrawerComponent) public drawerComponent: RadSideDrawerComponent;
    private drawer: SideDrawerType;

    ngAfterViewInit() {
        this.drawer = this.drawerComponent.sideDrawer;
        this._changeDetectionRef.detectChanges();
    }

    ngOnInit() {
        this.set("mainContentText", "SideDrawer for NativeScript can be easily setup in the XML definition of your page by defining main- and drawer-content. The component"
            + " has a default transition and position and also exposes notifications related to changes in its state. Swipe from left to open side drawer.");
    }

    public openDrawer() {
        this.drawer.showDrawer();
    }

}