import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a quantity for display (removes trailing zeros)
 */
export function formatQuantity(quantity) {
  if (quantity === null || quantity === undefined) return "";
  const num = parseFloat(quantity);
  if (isNaN(num)) return "";
  // Remove trailing zeros
  return num.toString();
}

/**
 * Format ingredient with quantity and unit
 */
export function formatIngredient(quantity, unit, name) {
  const parts = [];
  if (quantity) parts.push(formatQuantity(quantity));
  if (unit) parts.push(unit);
  parts.push(name);
  return parts.join(" ");
}
