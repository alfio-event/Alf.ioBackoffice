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
    templateUrl: "./event-header.html",
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