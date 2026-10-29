import policy from "../../services/collector/resources/timing.json" with { type: "json" };

// Segundos no arquivo comum; consumidores web convertem apenas na borda.
export const timing = Object.freeze(policy);
export const milliseconds = (seconds: number) => seconds * 1000;
