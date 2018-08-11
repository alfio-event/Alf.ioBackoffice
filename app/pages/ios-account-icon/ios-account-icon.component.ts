import {
    Component,
    Injectable,
    Input,
    OnInit} from '@angular/core';
import { Account } from "../../shared/account/account";
import { Observable, Subject } from 'rxjs';

@Component({
    moduleId: module.id,
    selector: "ios-account-icon",
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

    constructor() {
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