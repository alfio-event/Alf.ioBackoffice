import 'dart:io';

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:developer' as developer;
import 'dart:convert';

import 'package:intl/intl.dart';

import 'account_model.dart';

class EventModel extends ChangeNotifier {
  List<Event> events = [];
  late Account account;

  EventModel() {
    debugPrint("EventModel init");
  }

  setAccountData(Account account) {
    this.account = account;
    loadData();
  }

  loadData() async {
    events.clear();
    String path = "/admin/api/events";
    final response = await http.get(Uri.parse(account.baseUrl + path), headers: <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'ApiKey ${account.apiKey}',
    });
    developer.log("events response " + response.body);
    if (response.statusCode == 200) {
      var js = jsonDecode(response.body);
      for (var ejs in js) {
        Event e = Event.fromJson(ejs);
        e.baseUrl = account.baseUrl;
        events.add(e);
      }
    }
    notifyListeners();
  }

  String? currentSearchQuery;
  int? currentSearchTotalResult;
  int? currentSearchTotalPages;
  int? currentSearchPage;
  int? currentSearchCheckedIn;

  Future<List<Attendee>> search(String query, Event event, int page) async {
    String path = "/admin/api/check-in/event/${event.key}/attendees?query=$query&page=$page";
    final response = http.get(Uri.parse(account.baseUrl + path), headers: <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'ApiKey ${account.apiKey}',
    });
    return response.mapFromResponse<List<Attendee>, List<dynamic>>(
      (jsonResponse) => _parseItemListFromJsonResponse(
        jsonResponse,
        (jsonObject) => Attendee.fromJson(jsonObject),
      ),
    );

  }

  static List<T> _parseItemListFromJsonResponse<T>(
    List<dynamic> jsonResponse,
    T Function(dynamic object) mapper,
  ) {
    List<T> list = jsonResponse.map(mapper).toList();
    debugPrint(list.toString());
    return list;
  }

}

class GenericHttpException implements Exception {}

class NoConnectionException implements Exception {}

extension on Future<http.Response> {
  Future<R> mapFromResponse<R, T>(R Function(T) jsonParser) async {
    try {
      final response = await this;
      developer.log(response.body.toString());
      if (response.statusCode == 200) {
        return jsonParser(jsonDecode(response.body)["attendees"]);
      } else {
        throw GenericHttpException();
      }
    } on SocketException {
      throw NoConnectionException();
    }
  }
}

class Event {
  late String baseUrl;
  late String imageUrl;
  late String eventUrl;
  late String name;
  late String key;
  late String location;
  late DateTime startingDate;
  late DateTime closingDate;
  late String timeZone;

  Event.fromJson(Map<String, dynamic> json) {
    imageUrl = json["imageUrl"];
    eventUrl = json["url"];
    name = json["name"];
    key = json["key"];
    location = json["location"];
    timeZone = json["timeZone"];

    //TODO gestione delle time zone?
    startingDate = DateTime.parse(json["begin"]).toLocal();
    closingDate = DateTime.parse(json["end"]).toLocal();
  }
}

class Attendee {

  late String uuid;
  late String firstName;
  late String lastName;
  late String categoryName;
  //late Map<String, List<String>> additionalInfo;
  late String ticketStatus;
  //late String? amountToPay;

  Attendee.fromJson(Map<String, dynamic> json) {
    uuid = json["uuid"];
    firstName = json["firstName"];
    lastName = json["lastName"];
    categoryName = json["categoryName"];
    //additionalInfo = json["additionalInfo"];
    ticketStatus = json["ticketStatus"];
    //amountToPay = json["amountToPay"];
  }

}
