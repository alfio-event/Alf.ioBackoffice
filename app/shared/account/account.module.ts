import { NgModule } from "@angular/core";
import { AccountService } from "./account.service"
import { BARCODE_SCANNER, barcodescanner } from '../../utils/barcodescanner';

@NgModule({
    providers: [
        AccountService, 
        { provide: BARCODE_SCANNER, useValue: barcodescanner}
    ]
})
export class AccountModule {}