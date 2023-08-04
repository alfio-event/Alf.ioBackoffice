import {Account} from "../shared/account/account";
import {generateRandomOperatorName} from "./operatorNameGenerator";
import {StorageService} from "../shared/storage/storage.service";
import {logIfDevMode} from "~/app/utils/systemUtils";

const OPERATOR_NAME_PREFIX = "ALFIO_OPERATOR";

export function loadOperatorName(storage: StorageService, eventKey: string, account: Account): string {
  const key = `${OPERATOR_NAME_PREFIX}_${eventKey}_${account.getKey()}`;
  const savedId = storage.getOrDefault(key, "--");
  let operatorId;
  if (savedId !== "--") {
    logIfDevMode("returning existing operator", savedId);
    operatorId = savedId;
  } else {
    const generatedId = generateRandomOperatorName();
    storage.saveValue(key, generatedId);
    logIfDevMode("returning newly generated operator", generatedId);
    operatorId = generatedId;
  }
  // if the account has a nickname defined, we use it
  if (account.userConfiguration.operatorNickname != null) {
    logIfDevMode("operator nickname found: ", account.userConfiguration.operatorNickname);
    return account.userConfiguration.operatorNickname + '@' + operatorId;
  }
  // otherwise we return the generated ID
  return operatorId;
}
