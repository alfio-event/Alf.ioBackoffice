import { NgModule } from "@angular/core";
import { StatisticsService } from "~/shared/statistics/statistics.service";

@NgModule({
    providers: [
        StatisticsService
    ]
})
export class StatisticsModule {}