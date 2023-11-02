import 'package:alfio_scan/model/event_model.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'dart:developer' as developer;
import 'dart:convert';

part 'sponsor_scan_model.g.dart';

class SponsorScanModel extends ChangeNotifier {
  List<SponsorScan> sponsorScans = [];

  SponsorScanModel() {
    debugPrint("SponsorScanModel init");

  }

  loadData(Event event) async {
    var sponsorScanBox = await Hive.openBox<SponsorScan>('sponsorScanBox');

    print(sponsorScanBox.values.length);
    sponsorScans = sponsorScanBox.values.where((sponsorScan) => sponsorScan.eventKey==event.key).cast<SponsorScan>().toList();


    notifyListeners();
  }

  addNewScan(String eventKey, String badgeCode, String attendeeFullName) async {

    var sponsorScan = SponsorScan(eventKey, badgeCode, ScanStatus.NEW, LeadStatus.WARM, attendeeFullName, "");
    sponsorScans.add(sponsorScan);
    Box<SponsorScan> box;
    if (Hive.isBoxOpen('sponsorscanbox')) {
      box = Hive.box<SponsorScan>('sponsorscanbox');
    } else {
      box = await Hive.openBox<SponsorScan>('sponsorscanbox');
    }
    box.put(sponsorScan.badgeCode, sponsorScan);
    print(box.values.length);
    notifyListeners();
  }

  void deleteSponsorScan(SponsorScan sponsorScan) {}

  void setCurrentEvent(Event event) {
    loadData(event);
  }

  Future<void> updateSponsorScan(SponsorScan updatedSponsorScan) async {
    Box<SponsorScan> box;
    if (Hive.isBoxOpen('sponsorscanbox')) {
      box = Hive.box<SponsorScan>('sponsorscanbox');
    } else {
      box = await Hive.openBox<SponsorScan>('sponsorscanbox');
    }
    box.put(updatedSponsorScan.badgeCode, updatedSponsorScan);
  }

}

@HiveType(typeId: 3)
class SponsorScan {
  @HiveField(0)
  late String eventKey;
  @HiveField(1)
  late String badgeCode;
  @HiveField(2)
  late ScanStatus scanStatus;
  @HiveField(3)
  late LeadStatus leadStatus;
  @HiveField(4)
  late String attendeeFullName;
  @HiveField(5)
  late String comment;

  SponsorScan(this.eventKey, this.badgeCode, this.scanStatus, this.leadStatus, this.attendeeFullName, this.comment);
}

@HiveType(typeId: 4)
enum ScanStatus {
  @HiveField(0)
  NEW,
  @HiveField(1)
  IN_PROCESS,
  @HiveField(2)
  ERROR,
  @HiveField(3)
  DONE,
  @HiveField(4)
  UPDATED
}

@HiveType(typeId: 5)
enum LeadStatus {
  @HiveField(0)
  COLD,
  @HiveField(1)
  WARM,
  @HiveField(2)
  HOT,
}
