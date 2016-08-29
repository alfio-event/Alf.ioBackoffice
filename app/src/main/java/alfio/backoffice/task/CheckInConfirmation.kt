/**
 * This file is part of alf.io backoffice.

 * alf.io backoffice is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * alf.io backoffice is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with alf.io backoffice.  If not, see //www.gnu.org/licenses/>.
 */
package alfio.backoffice.task

import alfio.backoffice.service.CheckInService
import android.content.Context
import com.squareup.okhttp.Response

open class CheckInConfirmation(caller: Context, val executor: (TicketDetailParam, CheckInService) -> Response = {param, checkInService -> checkInService.checkInTicket(param.code, param.conf);}) : TicketDetailLoader(caller) {

    override fun performRequest(param: TicketDetailParam): Response {
        return executor.invoke(param, checkInService)
    }
}

class DeskPaymentConfirmation(caller: Context) : CheckInConfirmation(caller, {param, checkInService -> checkInService.confirmDeskPayment(param.code, param.conf);})