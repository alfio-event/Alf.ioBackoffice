import 'package:alfio_scan/model/account_model.dart';
import 'package:alfio_scan/model/stat_event_model.dart';
import 'package:alfio_scan/model/sponsor_scan_model.dart';
import 'package:alfio_scan/screens/event_details.dart';
import 'package:alfio_scan/screens/event_list.dart';
import 'package:flutter/material.dart';
import 'package:alfio_scan/screens/account_list.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/adapters.dart';
import 'package:provider/provider.dart';

import 'model/event_model.dart';

Future<void> main() async {
  await Hive.initFlutter();
  Hive.registerAdapter(AccountAdapter());
  Hive.registerAdapter(AccountTypeAdapter());
  Hive.registerAdapter(SponsorScanAdapter());
  Hive.registerAdapter(ScanStatusAdapter());
  Hive.registerAdapter(LeadStatusAdapter());

  //A COMMENT

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AccountModel()),
        ChangeNotifierProvider(create: (context) => EventModel()),
        ChangeNotifierProvider(create: (context) => SponsorScanModel()),
        ChangeNotifierProvider(create: (context) => StatEventModel())
      ],
      child: MaterialApp(
        title: 'Alf.io Scan',
        theme: ThemeData(
          // This is the theme of your application.
          //
          // Try running your application with "flutter run". You'll see the
          // application has a blue toolbar. Then, without quitting the app, try
          // changing the primarySwatch below to Colors.green and then invoke
          // "hot reload" (press "r" in the console where you ran "flutter run",
          // or simply save your changes to "hot reload" in a Flutter IDE).
          // Notice that the counter didn't reset back to zero; the application
          // is not restarted.
          primarySwatch: Colors.blue,
        ),
        home: const AccountListWidget(),
        //home: const EventListWidget(),
        //home: const EventDetailsWidget(),
      ),
    );
  }
}
