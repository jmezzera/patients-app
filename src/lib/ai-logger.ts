import { type TelemetryIntegration, bindTelemetryIntegration } from "ai";
import { createLogger } from "@/lib/logger";

const log = createLogger("ai");

class AiLoggerIntegration implements TelemetryIntegration {
  onStart(event: Parameters<NonNullable<TelemetryIntegration["onStart"]>>[0]) {
    log.debug("generation started", {
      model: event.model.modelId,
      provider: event.model.provider,
      functionId: event.functionId,
      // messages/prompt logged at debug — may contain sensitive user input
      messages: event.messages,
      prompt: event.prompt,
    });
  }

  onStepFinish(event: Parameters<NonNullable<TelemetryIntegration["onStepFinish"]>>[0]) {
    log.info("step finished", {
      model: event.model.modelId,
      step: event.stepNumber,
      finishReason: event.finishReason,
      usage: event.usage,
      toolCalls: event.toolCalls?.map((tc) => tc.toolName),
    });
  }

  onToolCallStart(event: Parameters<NonNullable<TelemetryIntegration["onToolCallStart"]>>[0]) {
    log.debug("tool call started", {
      tool: event.toolCall.toolName,
      id: event.toolCall.toolCallId,
      // input logged at debug — may contain patient data
      input: event.toolCall.input,
    });
  }

  onToolCallFinish(event: Parameters<NonNullable<TelemetryIntegration["onToolCallFinish"]>>[0]) {
    if (event.success) {
      log.debug("tool call finished", {
        tool: event.toolCall.toolName,
        id: event.toolCall.toolCallId,
        durationMs: event.durationMs,
      });
    } else {
      log.error("tool call failed", {
        tool: event.toolCall.toolName,
        id: event.toolCall.toolCallId,
        durationMs: event.durationMs,
        error: event.error,
      });
    }
  }

  onFinish(event: Parameters<NonNullable<TelemetryIntegration["onFinish"]>>[0]) {
    log.info("generation finished", {
      model: event.model.modelId,
      finishReason: event.finishReason,
      steps: event.steps.length,
      totalUsage: event.totalUsage,
    });
  }
}

export const aiLogger: TelemetryIntegration = bindTelemetryIntegration(new AiLoggerIntegration());
