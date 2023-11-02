import 'package:alfio_scan/components/scan_attendee_result.dart';
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

class AttendeeScannerScreenWidget extends StatefulWidget {
  AttendeeScannerScreenWidget({Key? key, required this.account, required this.event}) : super(key: key);

  Account account;
  Event event;

  @override
  _AttendeeScannerScreenWidgetState createState() => _AttendeeScannerScreenWidgetState(account, event);
}

class _AttendeeScannerScreenWidgetState extends State<AttendeeScannerScreenWidget> {
  _AttendeeScannerScreenWidgetState(this.account, this.event);

  Account account;
  Event event;
  MobileScannerController cameraController = MobileScannerController();

  final scaffoldKey = GlobalKey<ScaffoldState>();

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
            event.name,
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
        body: Consumer2<EventModel, StatEventModel>(builder: (context, eventModel, statEventModel, child) {
          return Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              Expanded(
                flex: 1,
                child: Padding(
                  padding: EdgeInsetsDirectional.fromSTEB(20, 12, 20, 0),
                  child: StatsWidget(),
                ),
              ),
              Expanded(
                flex: 9,
                child: Container(
                  decoration: BoxDecoration(color: Color.fromRGBO(100, 100, 100, 1)),
                  child: Padding(
                    padding: const EdgeInsets.all(18.0),
                    child: MobileScanner(
                        fit: BoxFit.scaleDown,
                        controller: cameraController,
                        allowDuplicates: false,
                        onDetect: (barcode, args) {
                          if (barcode.rawValue == null) {
                            debugPrint('Failed to scan Barcode');
                          } else {
                            final String code = barcode.rawValue!;
                            checkinTicket(code, context, statEventModel);
                          }
                        }),
                  ),
                ),
              ),
            ],
          );
        }));
  }

  Future<void> checkinTicket(String code, BuildContext context, StatEventModel statEventModel) async {
    debugPrint('Barcode found! $code');

    String tickedId = code.split("/").first;
    String path = "/admin/api/check-in/event/${event.key}/ticket/$tickedId";
    var post = await http.post(Uri.parse(account.baseUrl + path),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'ApiKey ${account.apiKey}',
        },
        body: "{\"code\": \"$code\"}");

    debugPrint(post.body);
    if (post.statusCode == 200) {
      var js = jsonDecode(post.body);
      debugPrint(js["result"]["status"]);

      showDialog(
          context: context,
          builder: (BuildContext context) {
            cameraController.stop();
            return ScanAttendeeResultWidget(TicketAndCheckInResult.fromJson(js));
          }).then((value) {
        debugPrint("Dialog closed");
        statEventModel.loadStatData();
        cameraController.start();
      });
    }

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
