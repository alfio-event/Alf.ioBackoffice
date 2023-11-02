import 'package:alfio_scan/components/scan_attendee_result.dart';
import 'package:alfio_scan/model/sponsor_scan_model.dart';
import 'package:intl/intl.dart';

import '../components/stats_widget.dart';
import '../flutter_flow/flutter_flow_theme.dart';
import '../flutter_flow/flutter_flow_util.dart';
import '../flutter_flow/flutter_flow_widgets.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../model/account_model.dart';
import '../model/event_model.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import '../model/stat_event_model.dart';
import '../model/ticket_checkin_result.dart';

class SponsorAttendeeScannerScreenWidget extends StatefulWidget {
  SponsorAttendeeScannerScreenWidget({Key? key, required this.account, required this.event}) : super(key: key);

  Account account;
  Event event;

  @override
  _SponsorAttendeeScannerScreenWidgetState createState() => _SponsorAttendeeScannerScreenWidgetState(account, event);
}

class _SponsorAttendeeScannerScreenWidgetState extends State<SponsorAttendeeScannerScreenWidget> {
  _SponsorAttendeeScannerScreenWidgetState(this.account, this.event);

  Account account;
  Event event;
  MobileScannerController cameraController = MobileScannerController();

  final scaffoldKey = GlobalKey<ScaffoldState>();

  List<String> scannedBadges = [];

  @override
  Widget build(BuildContext context) {
    //context.watch<FFAppState>();

    return Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
          automaticallyImplyLeading: false,
          leading: InkWell(
            onTap: () async {
              Navigator.pop(context);
            },
            child: Icon(
              Icons.chevron_left_rounded,
              color: FlutterFlowTheme.of(context).primaryText,
              size: 32,
            ),
          ),
          title: Text(
            "${event.name} ${account.description}",
            style: FlutterFlowTheme.of(context).subtitle1,
          ),
          actions: [
            IconButton(
              color: Colors.white,
              icon: ValueListenableBuilder(
                valueListenable: cameraController.torchState,
                builder: (context, state, child) {
                  switch (state as TorchState) {
                    case TorchState.off:
                      return const Icon(Icons.flash_off, color: Colors.grey);
                    case TorchState.on:
                      return const Icon(Icons.flash_on, color: Colors.yellow);
                  }
                },
              ),
              iconSize: 32.0,
              onPressed: () => cameraController.toggleTorch(),
            ),
          ],
          centerTitle: false,
          elevation: 0,
        ),
        body: Consumer<EventModel>(builder: (context, eventModel, child) {
          return Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              Expanded(
                flex: 1,
                child: Container(
                  decoration: BoxDecoration(color: Color.fromRGBO(100, 100, 100, 1)),
                  child: Padding(
                    padding: const EdgeInsets.all(2.0),
                    child: MobileScanner(
                        fit: BoxFit.fill,
                        controller: cameraController,
                        allowDuplicates: false,
                        onDetect: (barcode, args) {
                          if (barcode.rawValue == null) {
                            debugPrint('Failed to scan Barcode');
                          } else {
                            final String code = barcode.rawValue!;
                            addBadgeToList(code, context);
                          }
                        }),
                  ),
                ),
              ),
              Expanded(
                flex: 1,
                child: ListView.builder(
                  itemCount: scannedBadges.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(
                        scannedBadges[index],
                        style: TextStyle(fontSize: 16),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        }));
  }

  Future<void> addBadgeToList(String code, BuildContext context) async {
    debugPrint('Barcode found! $code');

    var split = code.split("::");

    setState(() {
      scannedBadges.insert(0, "${split[1]} ${split[2]}");
    });

    Provider.of<SponsorScanModel>(context, listen: false).addNewScan(event.key, code, "${split[1]} ${split[2]}");




    /*showDialog(
        context: context,
        builder: (BuildContext context) {
          cameraController.stop();
          return AlertDialog(
            title: Text("Success"),
            content: Text("Saved successfully"),
            actions: [
              ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    cameraController.start();
                  },
                  child: Text("Close")),
            ],
          );
        });*/
  }
}
