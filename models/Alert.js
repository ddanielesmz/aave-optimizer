import mongoose from "mongoose";
import toJSON from "./plugins/toJSON.js";

const alertSchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: false,
    },
    widgetType: {
      type: String,
      required: true,
      enum: ["healthFactor", "ltv", "netAPY"],
      trim: true,
    },
    alertName: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ["greater_than", "less_than", "equals"],
    },
    threshold: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    telegramUsername: {
      type: String,
      required: true,
      trim: true,
    },
    lastTriggered: {
      type: Date,
      default: null,
    },
    cooldownMinutes: {
      type: Number,
      default: 60, // Minuti di cooldown tra alert consecutivi
    },
    customMessage: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index per performance
alertSchema.index({ createdBy: 1, widgetType: 1 });
alertSchema.index({ widgetType: 1 });
alertSchema.index({ isActive: 1 });

// Plugin per JSON pulito
alertSchema.plugin(toJSON);

// Metodo per verificare se l'alert può essere triggerato
alertSchema.methods.canTrigger = function() {
  if (!this.isActive) return false;
  
  if (this.lastTriggered) {
    const cooldownMs = this.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - this.lastTriggered.getTime();
    return timeSinceLastTrigger >= cooldownMs;
  }
  
  return true;
};

// Metodo per verificare se il valore soddisfa la condizione
alertSchema.methods.checkCondition = function(currentValue) {
  switch (this.condition) {
    case "greater_than":
      return currentValue > this.threshold;
    case "less_than":
      return currentValue < this.threshold;
    case "equals":
      return Math.abs(currentValue - this.threshold) < 0.001; // Tolleranza per float
    default:
      return false;
  }
};

export default mongoose.models.Alert || mongoose.model("Alert", alertSchema);
