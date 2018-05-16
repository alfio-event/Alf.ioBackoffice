import { NgModule } from "@angular/core";
import { AccountService } from "./account.service"
import { AccountSelectionNotifier } from "./account-selection-notifier";
import { BarcodeScanner } from "nativescript-barcodescanner";

@NgModule({
    providers: [
        AccountService, 
        AccountSelectionNotifier, 
        BarcodeScanner
    ]
})
export class AccountModule {}