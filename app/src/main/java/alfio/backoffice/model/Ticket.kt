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
package alfio.backoffice.model

import java.io.Serializable
import java.math.BigDecimal

class Ticket : Serializable {
    var id: Long? = null;
    var uuid: String? = null;
    var status: String? = null;
    var ticketsReservationId: String? = null;
    var fullName: String? = null;
    val email: String? = null;
}

class TicketAndCheckInResult {
    var ticket: Ticket? = null;
    var result: CheckInResult? = null;
}

class CheckInResult {
    var status: CheckInStatus = CheckInStatus.TICKET_NOT_FOUND;
    var message: String? = null;
    var dueAmount: BigDecimal = BigDecimal.ZERO;
    var currency: String = "";
}

enum class CheckInStatus(val successful: Boolean = false) {
    RETRY(),
    EVENT_NOT_FOUND(),
    TICKET_NOT_FOUND(),
    EMPTY_TICKET_CODE(),
    INVALID_TICKET_CODE(),
    INVALID_TICKET_STATE(),
    ALREADY_CHECK_IN(),
    MUST_PAY(),
    OK_READY_TO_BE_CHECKED_IN(true),
    SUCCESS(true);
}

