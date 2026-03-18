import { buildContext as buildSystemContext } from "../data/systemState.js";

export function buildContext(question) {

  const context = buildSystemContext(question);

  if (!context) {
    return null;
  }

  return context;

}