import { systemState } from "../data/systemState.js";

export function buildContext() {
  return {
    generated_at: new Date().toISOString(),
    ...systemState
  };
}
