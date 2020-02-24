import {
    Component,
    EventEmitter,
    Injectable,
    Input,
    OnInit,
    Output} from '@angular/core';
import { Account, EventConfiguration } from "../../shared/account/account";

@Component({
    moduleId: module.id,
    selector: "event-header",
    template: `<GridLayout columns="10, *, 35" *ngIf="event">
                    <StackLayout col="1" class="m-10" orientation="vertical">
                        <Label [text]="event.name" class="eventName" textWrap="true"></Label>
                        <Label text="{{ event.begin | date:'short' }} - {{ event.end | date:'short' }}" *ngIf="!event.oneDay"></Label>
                        <Label text="{{ event.begin | date:'shortDate' }} {{ event.begin | date:'shortTime' }} - {{ event.end | date:'shortTime' }}" *ngIf="event.oneDay"></Label>
                        <Label [text]="event.location"></Label>
                    </StackLayout>
                    <Label [text]="iconText" col="2" class="icon icon-1-5x person-icon text-center" *ngIf="list"></Label>
                </GridLayout>`,
    styleUrls: ['./event-header-common.scss']
})
@Injectable()
export class EventHeaderComponent implements OnInit {

    isLoading: boolean;
    @Input() event: EventConfiguration;
    @Input() list: boolean;
    @Input() account: Account;
    @Output() onTap = new EventEmitter();

    eventImage: string;

    constructor() {
    }

    ngOnInit(): void {
        this.isLoading = true;
    }

    get iconText(): string {
        return this.list ? String.fromCharCode(0xf2fb) : "";
    }
}