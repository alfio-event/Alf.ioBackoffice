import {Account} from "../shared/account/account";
import {generateRandomOperatorName} from "./operatorNameGenerator";
import {StorageService} from "../shared/storage/storage.service";
import {logIfDevMode} from "~/app/utils/systemUtils";

const OPERATOR_NAME_PREFIX = "ALFIO_OPERATOR";

export function loadOperatorName(storage: StorageService, eventKey: string, account: Account): string {
  const key = `${OPERATOR_NAME_PREFIX}_${eventKey}_${account.getKey()}`;
  const savedId = storage.getOrDefault(key, "--");
  if (savedId !== "--") {
    logIfDevMode("returning existing operator", savedId);
    return savedId;
  } else {
    const generatedId = generateRandomOperatorName();
    storage.saveValue(key, generatedId);
    logIfDevMode("returning newly generated operator", generatedId);
    return generatedId;
  }
}
