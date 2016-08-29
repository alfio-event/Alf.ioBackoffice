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
import com.google.gson.reflect.TypeToken
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

object SponsorScanManager {

    private var savedSponsorScan: MutableSet<SponsorScanDescriptor>? = null
    private val sponsorScan: MutableSet<SponsorScanDescriptor>
        get() = if(savedSponsorScan != null) {
            savedSponsorScan!!
        } else {
            savedSponsorScan = SharedPreferencesHolder.sharedPreferences.loadSavedValue(KEY_PENDING_SPONSOR_SCAN, SerializedScans(), {
                val container = Collections.newSetFromMap(ConcurrentHashMap<SponsorScanDescriptor, Boolean>())
                if (it != null) {
                    container.addAll(it)
                }
                container
            })
            savedSponsorScan!!
        }

    val latestUpdate: Date?
        get() = if(SharedPreferencesHolder.sharedPreferences.contains(KEY_LATEST_UPDATE)) {
            SharedPreferencesHolder.sharedPreferences.loadSavedValue(KEY_LATEST_UPDATE, SerializedDate(), {it})
        } else {
            null
        }

    val offlineScanEnabled: Boolean
        get() = SharedPreferencesHolder.sharedPreferences.getBoolean(KEY_OFFLINE_SCAN_ENABLED, true)

    fun retrievePendingSponsorScan(max: Int): Map<AlfioConfiguration, List<String>> {
        var counter = 0
        val elements = sponsorScan.filter { toBeProcessed(it) }.takeWhile { counter++ < max }
        sponsorScan.removeAll(elements)
        sponsorScan.addAll(elements.map { SponsorScanDescriptor.build(it.configuration!!, it.code, ScanStatus.IN_PROCESS, updateTs = Date(), counter = it.counter) })
        SharedPreferencesHolder.sharedPreferences.synchronizedPersist(sponsorScan, KEY_PENDING_SPONSOR_SCAN)
        return elements.groupBy({ it.configuration!! }, {it.code})
    }

    private fun toBeProcessed(sd: SponsorScanDescriptor) = sd.status == ScanStatus.NEW || sd.status == ScanStatus.IN_PROCESS && System.currentTimeMillis() - sd.updateTs.time > ONE_MINUTE

    fun retrieveAllSponsorScan() : List<SponsorScanDescriptor> = ArrayList(sponsorScan)

    fun enqueueSponsorScan(configuration: AlfioConfiguration, code: String) = enqueueScan(configuration, code, ScanStatus.NEW)

    fun enqueueSuccessfulSponsorScan(configuration: AlfioConfiguration, code: String, ticket: Ticket) = enqueueScan(configuration, code, ScanStatus.DONE, ticket)

    private fun enqueueScan(configuration: AlfioConfiguration, code: String, status: ScanStatus, ticket: Ticket? = null) {
        sponsorScan.add(SponsorScanDescriptor.build(configuration, code, status, ticket))
        SharedPreferencesHolder.sharedPreferences.synchronizedPersist(sponsorScan, KEY_PENDING_SPONSOR_SCAN)
    }

    fun confirmSponsorsScan(configuration: AlfioConfiguration, results: List<Pair<String, TicketAndCheckInResult>>) : Boolean {
        val result = replaceSponsorsScan(configuration, results, sponsorScan)
        if(result) {
            SharedPreferencesHolder.sharedPreferences.persist(Date(), KEY_LATEST_UPDATE)
            SharedPreferencesHolder.sharedPreferences.synchronizedPersist(sponsorScan, KEY_PENDING_SPONSOR_SCAN)
        }
        return result
    }

    fun replaceSponsorsScan(configuration: AlfioConfiguration, results: List<Pair<String, TicketAndCheckInResult>>, src: MutableSet<SponsorScanDescriptor>) : Boolean {
        val updatedItems = results.map {
            it.second to src.firstOrNull(pendingDescriptorFinder(configuration, it.first to it.second))
        }.filter {
            it.second != null
        }.map {
            it.second to SponsorScanDescriptor.build(configuration, it.second!!.code, ScanStatus.DONE, it.first.ticket, Date())
        }
        return src.removeAll(updatedItems.map { it.first }) && src.addAll(updatedItems.map { it.second })
    }

    fun registerScanError(configuration: AlfioConfiguration, result: Pair<String, TicketAndCheckInResult>) {
        val found = sponsorScan.firstOrNull(pendingDescriptorFinder(configuration, result))
        if(found != null) {
            sponsorScan.remove(found)
            val newCount = found.counter.inc()
            sponsorScan.add(SponsorScanDescriptor.build(configuration, found.code, if(newCount > 4) ScanStatus.ERROR else found.status, updateTs = Date(), counter = newCount))
            SharedPreferencesHolder.sharedPreferences.synchronizedPersist(sponsorScan, KEY_PENDING_SPONSOR_SCAN)
        }
    }

    private fun pendingDescriptorFinder(configuration: AlfioConfiguration, result: Pair<String, TicketAndCheckInResult>) : (SponsorScanDescriptor) -> Boolean {
        return {it.status == ScanStatus.IN_PROCESS && it.code.equals(result.first) && it.configuration!!.equals(configuration)}
    }
}

class SponsorScanDescriptor() : Comparable<SponsorScanDescriptor> {

    var configuration: AlfioConfiguration? = null
    var code: String = ""
    var status: ScanStatus = ScanStatus.NEW
    var ticket: Ticket? = null
    var updateTs: Date = Date(0)
    var counter: Int = 0

    override fun compareTo(other: SponsorScanDescriptor): Int {
        return code.compareTo(other.code)
    }

    override fun equals(other: Any?): Boolean{
        if (this === other) return true
        if (other?.javaClass != javaClass) return false

        other as SponsorScanDescriptor

        if (configuration != other.configuration) return false
        if (code != other.code) return false

        return true
    }

    override fun hashCode(): Int{
        var result = configuration?.hashCode() ?: 0
        result += 31 * result + code.hashCode()
        return result
    }


    companion object {
        fun build(configuration: AlfioConfiguration, code: String, status: ScanStatus, ticket: Ticket? = null, updateTs: Date = Date(0), counter: Int = 0): SponsorScanDescriptor {
            val descriptor = SponsorScanDescriptor()
            descriptor.configuration = configuration
            descriptor.code = code
            descriptor.status = status
            descriptor.ticket = ticket
            descriptor.updateTs = updateTs
            descriptor.counter = counter
            return descriptor
        }
    }


}

class SerializedScans : TypeToken<MutableSet<SponsorScanDescriptor>>()
class SerializedDate: TypeToken<Date?>()

private val KEY_PENDING_SPONSOR_SCAN = "alfio-pending-sponsor-scan"
private val KEY_LATEST_UPDATE = "alfio-sponsor-scan-latest-update"
private val KEY_OFFLINE_SCAN_ENABLED = "enable_sponsor_offline_scan"

private val ONE_MINUTE = TimeUnit.MINUTES.toMillis(1L)

enum class ScanStatus() {
    NEW, IN_PROCESS, ERROR, DONE
}