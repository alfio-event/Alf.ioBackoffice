import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Injectable,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { View } from "ui/core/view";
import { Page } from "ui/page";
import { ActionItem } from "ui/action-bar";
import { RouterExtensions } from "nativescript-angular/router";
import { AccountService } from "../../shared/account/account.service";
import { ImageService } from "../../shared/image/image.service";
import { Account, EventConfiguration, EventWithImage } from "../../shared/account/account";
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Component({
    moduleId: module.id,
    selector: "ios-account-icon",
    providers: [ImageService],
    template: `<Label [text]="text" class="delete-item icon icon-1-5x" (tap)="select(account)" [class.icon-forward]="!editEnabled" [class.icon-trash]="editEnabled"></Label>`,
    styleUrls: ['./ios-account-icon-common.css']
})
@Injectable()
export class IosAccountIconComponent implements OnInit{

    text: string;
    @Input() account: Account;
    @Input() editEnableObservable: Observable<boolean>;
    @Input() tapEmitter:Subject<Account>;
    editEnabled: boolean;

    constructor(private imageService: ImageService) {
    }
    
    ngOnInit():void {
        this.setText(false);
        this.editEnableObservable.subscribe(enabled => this.setText(enabled));
    }
    
    private setText(enabled: boolean) {
        this.editEnabled = enabled;
        if(enabled) {
            this.text = String.fromCharCode(0xf154);
        } else {
            this.text = String.fromCharCode(0xf2fb);
        }
    } 

    select(): void {
        this.tapEmitter.next(this.account);
    }
}