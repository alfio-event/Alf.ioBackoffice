import { NgModule } from "@angular/core";
import { AccountService } from "./account.service"
import { BARCODE_SCANNER, barcodescanner } from '../../utils/barcodescanner';
import { AccountSelectionNotifier } from "./account-selection-notifier";

@NgModule({
    providers: [
        AccountService, 
        { provide: BARCODE_SCANNER, useValue: barcodescanner},
        AccountSelectionNotifier
    ]
})
export class AccountModule {}