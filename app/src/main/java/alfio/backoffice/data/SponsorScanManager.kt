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
package alfio.backoffice.data

import alfio.backoffice.model.AlfioConfiguration
import alfio.backoffice.model.Ticket
import alfio.backoffice.model.TicketAndCheckInResult
import android.util.Log
import com.google.gson.reflect.TypeToken
import java.util.concurrent.ConcurrentSkipListSet

object SponsorScanManager {

    private val sponsorScan: MutableSet<SponsorScanDescriptor>;
    val offlineScanEnabled: Boolean
        get() = SharedPreferencesHolder.sharedPreferences.getBoolean(KEY_OFFLINE_SCAN_ENABLED, true);

    init {
        this.sponsorScan = SharedPreferencesHolder.sharedPreferences.loadSavedValue(KEY_PENDING_SPONSOR_SCAN, SerializedScans(), { if (it != null) ConcurrentSkipListSet(it) else ConcurrentSkipListSet() });
    }

    fun retrievePendingSponsorScan(max: Int): Map<AlfioConfiguration, List<String>> {
        var counter = 0;
        val elements = sponsorScan.takeWhile { it.status == ScanStatus.NEW && counter++ < max };
        sponsorScan.removeAll(elements);
        sponsorScan.addAll(elements.map { SponsorScanDescriptor(it.configuration, it.code, ScanStatus.IN_PROCESS) });
        SharedPreferencesHolder.sharedPreferences.synchronizedPersist(sponsorScan, KEY_PENDING_SPONSOR_SCAN);
        return elements.groupBy({ it.configuration }, {it.code});
    };

    fun enqueueSponsorScan(configuration: AlfioConfiguration, code: String) = enqueueScan(configuration, code, ScanStatus.NEW);

    fun enqueueSuccessfulSponsorScan(configuration: AlfioConfiguration, code: String, ticket: Ticket) = enqueueScan(configuration, code, ScanStatus.DONE, ticket);

    private fun enqueueScan(configuration: AlfioConfiguration, code: String, status: ScanStatus, ticket: Ticket? = null) {
        Log.i("sponsorScan", "adding code $code with status $status, current size is ${sponsorScan.size}")
        val result = sponsorScan.add(SponsorScanDescriptor(configuration, code, status));
        Log.i("sponsorScan", "added $code with status $status, result: $result, current size is ${sponsorScan.size}")
        SharedPreferencesHolder.sharedPreferences.synchronizedPersist(sponsorScan, KEY_PENDING_SPONSOR_SCAN);
    }

    fun confirmSponsorsScan(configuration: AlfioConfiguration, results: List<Pair<String, TicketAndCheckInResult>>) : Boolean {
        val result = sponsorScan.addAll(results
                .filter { sponsorScan.remove(SponsorScanDescriptor(configuration, it.first, ScanStatus.IN_PROCESS)) }
                .map { SponsorScanDescriptor(configuration, it.first, ScanStatus.DONE, it.second.ticket) });
        if(result) {
            SharedPreferencesHolder.sharedPreferences.synchronizedPersist(sponsorScan, KEY_PENDING_SPONSOR_SCAN);
        }
        return result;
    };
}

data class SponsorScanDescriptor(val configuration: AlfioConfiguration, val code: String, val status: ScanStatus, val ticket: Ticket? = null) : Comparable<SponsorScanDescriptor> {

    override fun compareTo(other: SponsorScanDescriptor): Int {
        return code.compareTo(other.code);
    }

    fun hasTicket(): Boolean {
        return ticket != null;
    }
};
class SerializedScans : TypeToken<MutableSet<SponsorScanDescriptor>>();
private val KEY_PENDING_SPONSOR_SCAN = "alfio-pending-sponsor-scan";
private val KEY_OFFLINE_SCAN_ENABLED = "enable_sponsor_offline_scan";

enum class ScanStatus() {
    NEW, IN_PROCESS, DONE
}