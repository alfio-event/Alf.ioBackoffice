import {
    Component,
    EventEmitter,
    Injectable,
    Input,
    OnInit,
    Output} from '@angular/core';
import { ImageService } from "../../shared/image/image.service";
import { Account, EventConfiguration } from "../../shared/account/account";

@Component({
    moduleId: module.id,
    selector: "event-header",
    providers: [ImageService],
    template: `<GridLayout columns="70, auto" *ngIf="event">
                    <Image col="0" [src]="eventImage" stretch="aspectFit" width="70" height="70"></Image>
                    <StackLayout col="1" class="medium-spacing" orientation="vertical" (tap)="select()">
                        <Label [text]="event.name" class="eventName"></Label>
                        <Label text="{{ event.begin | date:'short' }} - {{ event.end | date:'short' }}" *ngIf="!event.oneDay"></Label>
                        <Label text="{{ event.begin | date:'shortDate' }} {{ event.begin | date:'shortTime' }} - {{ event.end | date:'shortTime' }}" *ngIf="event.oneDay"></Label>
                        <Label [text]="event.location"></Label>
                    </StackLayout>
                </GridLayout>`,
    styleUrls: ['./event-header-common.css']
})
@Injectable()
export class EventHeaderComponent implements OnInit {

    isLoading: boolean;
    @Input() event: EventConfiguration;
    @Input() account: Account;
    @Output() onTap = new EventEmitter();

    eventImage: string;

    constructor(private imageService: ImageService) {
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.imageService.getImage(this.account, this.event).subscribe(imgUrl => {
            this.eventImage = imgUrl;
            this.isLoading = false;
        })
    }

    select(): void {
        this.onTap.emit(this.event);
    }
}