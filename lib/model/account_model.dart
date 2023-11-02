import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'dart:developer' as developer;
import 'dart:convert';

part 'account_model.g.dart';

class AccountModel extends ChangeNotifier {

  List<Account> accounts = [];


  AccountModel() {
    debugPrint("AccountModel init");

    loadData();
  }

  loadData() async {

    // TODO load account basic info from storage and call API to populate details
    
    //addAccountFromJson("{\"baseUrl\":\"https://m4.test.alf.io\",\"apiKey\":\"2a47074c-6988-4024-91a2-09d1b9d67996\"}");
    var accountBox = await Hive.openBox('accountBox');

    //var accountBox = Hive.box("accountBox");
    accounts = accountBox.get("accounts", defaultValue: <Account>[]).cast<Account>();

    notifyListeners();
  }

  addAccountFromJson(String json) {
    var js = jsonDecode(json);
    addAccount(js["baseUrl"], js["apiKey"]);
  }

  addAccount(String baseUrl, String apiKey) async {
    String path = "/admin/api/user/details";
    final response = await http.get(Uri.parse(baseUrl + path), headers: <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'ApiKey $apiKey',
    });
    developer.log("account details response " + response.body);
    if (response.statusCode == 200) {
      var js = jsonDecode(response.body);
      Account a = Account.fromJson(js);
      a.baseUrl = baseUrl;
      accounts.add(a);
    }

    //TODO save new account to storage
    var accountBox = Hive.box("accountBox");
    accountBox.clear();

    accountBox.put("accounts", accounts);

    notifyListeners();

  }

  void deleteAccount(Account account) {
    accounts.remove(account);
    var accountBox = Hive.box("accountBox");
    accountBox.clear();

    accountBox.put("accounts", accounts);

    notifyListeners();

  }

}

@HiveType(typeId: 1)
class Account {

  @HiveField(0)
  late String baseUrl;
  @HiveField(1)
  late String apiKey;
  @HiveField(2)
  late String description;
  @HiveField(3)
  late AccountType accountType;

  Account(this.baseUrl, this.apiKey, this.description, this.accountType);

  Account.fromJson(Map<String, dynamic> json) {
    apiKey = json["apiKey"];
    description = json["description"];
    accountType = fromString(json["userType"]);
  }

  AccountType fromString(str) {
    AccountType f = AccountType.values.firstWhere((e) => describeEnum(e) == str);
    return f;
  }

}

@HiveType(typeId: 2)
enum AccountType {
  @HiveField(0)
  STAFF,

  @HiveField(1)
  SUPERVISOR,

  @HiveField(2)
  SPONSOR
}
