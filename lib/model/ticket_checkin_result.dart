

class TicketAndCheckInResult {

  late Ticket ticket;
  late CheckInResult checkInResult;
  List<AdditionalService> additionalServices = [];

  TicketAndCheckInResult.fromJson(Map<String, dynamic> json) {
    if (json["ticket"] != null) {
      ticket = Ticket.fromJson(json["ticket"]);
    } else {
      ticket = Ticket.blank();
    }
    checkInResult = CheckInResult.fromJson(json["result"]);
    if (json["additionalServices"] != null) {
      additionalServices = (json['additionalServices'] as List).map((e) => AdditionalService.fromJson(e)).toList();
    }
  }

}

//TODO verificare e completare i servizi addizionali
class AdditionalService {
  AdditionalService.fromJson(Map<String, dynamic> json) {

  }
}

class CheckInResult {

  late String status;
  late String message;

  CheckInResult.fromJson(Map<String, dynamic> json) {
    status = json["status"];
    message = json["message"];
  }
}

//TODO completare con i campi mancanti necessari
class Ticket {

  late String fullName;
  late String categoryName;
  late String uuid;

  Ticket.fromJson(Map<String, dynamic> json) {
    fullName = json["fullName"];
    categoryName = json["categoryName"];
    uuid = json["uuid"];
  }

   Ticket.blank() {
     fullName ="";
     categoryName = "";
     uuid = "";
   }
}