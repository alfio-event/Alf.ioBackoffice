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
    template: `<GridLayout columns="35, *, 35" *ngIf="event">
                    <Label text="&#xf1df;" col="0" class="icon icon-1-5x person-icon text-primary text-center v-middle"></Label>
                    <StackLayout col="1" class="medium-spacing" orientation="vertical" (tap)="select()">
                        <Label [text]="event.name" class="eventName" textWrap="true"></Label>
                        <Label text="{{ event.begin | date:'short' }} - {{ event.end | date:'short' }}" *ngIf="!event.oneDay"></Label>
                        <Label text="{{ event.begin | date:'shortDate' }} {{ event.begin | date:'shortTime' }} - {{ event.end | date:'shortTime' }}" *ngIf="event.oneDay"></Label>
                        <Label [text]="event.location"></Label>
                    </StackLayout>
                    <Label [text]="iconText" col="2" class="icon icon-1-5x person-icon text-center" *ngIf="list"></Label>
                </GridLayout>`,
    styleUrls: ['./event-header-common.css']
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

    select(): void {
        this.onTap.emit(this.event);
    }

    get iconText(): string {
        return this.list ? String.fromCharCode(0xf2fb) : "";
    }
}