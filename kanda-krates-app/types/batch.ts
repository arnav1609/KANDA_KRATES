export type Batch = {
  id: string;
  quantityKg: number;
  ohi: number;
  tier: "Normal" | "Alert" | "Action" | "Emergency";
};