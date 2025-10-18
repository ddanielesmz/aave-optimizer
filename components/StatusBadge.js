"use client";

import React from "react";

// Unified status badge for statuses like Safe, Caution, Risk, High Risk, Liquidation
export default function StatusBadge({ status, size = "sm", outline = true, className = "" }) {
  const normalized = (status || "").toString().trim().toLowerCase();

  // Map status to DaisyUI badge color classes
  let colorClass = "badge-neutral";
  if (normalized === "safe") colorClass = "badge-success";
  else if (normalized === "caution" || normalized === "risk") colorClass = "badge-warning";
  else if (normalized === "high risk" || normalized === "liquidation") colorClass = "badge-error";

  const sizeClass = size === "lg" ? "badge-lg" : size === "md" ? "badge-md" : "badge-sm";
  const outlineClass = outline ? "badge-outline" : "";

  return (
    <span className={["badge", sizeClass, colorClass, outlineClass, className].filter(Boolean).join(" ")}>{status}</span>
  );
}


