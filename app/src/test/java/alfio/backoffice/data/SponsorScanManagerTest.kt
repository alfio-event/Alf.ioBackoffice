package alfio.backoffice.data

import alfio.backoffice.model.*
import org.junit.Assert.*
import org.junit.Test
import java.util.*

class SponsorScanManagerTest {


    @Test
    fun testReplaceSponsorsScanOK() {
        val code = "code"
        val tcr = TicketAndCheckInResult()
        tcr.result = CheckInResult()
        tcr.result!!.status = CheckInStatus.SUCCESS
        val configuration = AlfioConfiguration("url", "username", "password", UserType.SPONSOR, Event())
        val src = mutableSetOf(sponsorScanDescriptor(code, configuration, ScanStatus.IN_PROCESS))
        val result = SponsorScanManager.replaceSponsorsScan(configuration, listOf(code to tcr), src)
        assertTrue(result)
        assertTrue(src.all { it.status == ScanStatus.DONE })
    }

    @Test
    fun testReplaceSponsorsScanOne() {
        val code = "code"
        val tcr = TicketAndCheckInResult()
        tcr.result = CheckInResult()
        tcr.result!!.status = CheckInStatus.SUCCESS
        val configuration = AlfioConfiguration("url", "username", "password", UserType.SPONSOR, Event())
        val src = mutableSetOf(sponsorScanDescriptor(code, configuration, ScanStatus.IN_PROCESS), sponsorScanDescriptor("${code}1", configuration, ScanStatus.IN_PROCESS))
        val result = SponsorScanManager.replaceSponsorsScan(configuration, listOf(code to tcr), src)
        assertTrue(result)
        val partitioned = src.partition { it.status == ScanStatus.DONE }
        assertTrue(partitioned.first.size == 1)
        assertEquals(code, partitioned.first[0].code)
    }

    @Test
    fun testReplaceSponsorsScanNone() {
        val code = "code"
        val tcr = TicketAndCheckInResult()
        tcr.result = CheckInResult()
        tcr.result!!.status = CheckInStatus.SUCCESS
        val configuration = AlfioConfiguration("url", "username", "password", UserType.SPONSOR, Event())
        val src = mutableSetOf(sponsorScanDescriptor("${code}0", configuration, ScanStatus.IN_PROCESS), sponsorScanDescriptor("${code}1", configuration, ScanStatus.IN_PROCESS))
        val result = SponsorScanManager.replaceSponsorsScan(configuration, listOf(code to tcr), src)
        assertFalse(result)
        val partitioned = src.partition { it.status == ScanStatus.DONE }
        assertTrue(partitioned.first.size == 0)
    }

    @Test
    fun testReplaceSponsorsScanAll() {
        val code = "code"
        val tcr = TicketAndCheckInResult()
        tcr.result = CheckInResult()
        tcr.result!!.status = CheckInStatus.SUCCESS
        val configuration = AlfioConfiguration("url", "username", "password", UserType.SPONSOR, Event())
        val src = mutableSetOf(sponsorScanDescriptor("${code}0", configuration, ScanStatus.IN_PROCESS), sponsorScanDescriptor("${code}1", configuration, ScanStatus.IN_PROCESS))
        val result = SponsorScanManager.replaceSponsorsScan(configuration, listOf("${code}0" to tcr, "${code}1" to tcr), src)
        assertTrue(result)
        assertTrue(src.all { it.status == ScanStatus.DONE })

    }

    private fun sponsorScanDescriptor(code: String, configuration: AlfioConfiguration, status: ScanStatus, counter: Int = 0, updateTs: Date = Date()): SponsorScanDescriptor {
        val descriptor = SponsorScanDescriptor()
        descriptor.status = status
        descriptor.code = code
        descriptor.configuration = configuration
        descriptor.counter = counter
        descriptor.updateTs = updateTs
        return descriptor
    }
}