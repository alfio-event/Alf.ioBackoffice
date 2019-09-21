import { NgModule } from "@angular/core";
import { AccountModule } from "../account/account.module";
import { SponsorScanService } from "./sponsor-scan.service";

@NgModule({
    imports: [
        AccountModule
    ],
    providers: [
        SponsorScanService
    ]
})
export class SponsorModule {}