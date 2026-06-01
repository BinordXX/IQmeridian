export type AssessmentFlowStatus =
  | "loading"
  | "ready"
  | "active"
  | "saving"
  | "saved"
  | "section-ended"
  | "submitting"
  | "completed"
  | "expired"
  | "error";

export type AssessmentFlowError = {
  message: string;
  code?: string;
};

export type AssessmentFlowState = {
  status: AssessmentFlowStatus;
  previousStatus?: AssessmentFlowStatus;
  sessionId?: string;
  assessmentId?: string;
  currentSectionId?: string;
  currentItemId?: string;
  expiresAt?: string;
  lastSavedAt?: string;
  error?: AssessmentFlowError;
};

export type AssessmentFlowEvent =
  | {
      type: "LOAD_STARTED";
    }
  | {
      type: "READY";
      sessionId?: string;
      assessmentId?: string;
      expiresAt?: string;
    }
  | {
      type: "STARTED";
      sessionId: string;
      assessmentId: string;
      currentSectionId?: string;
      currentItemId?: string;
      expiresAt?: string;
    }
  | {
      type: "SAVE_STARTED";
    }
  | {
      type: "SAVE_SUCCEEDED";
      savedAt: string;
    }
  | {
      type: "SECTION_ENDED";
      sectionId: string;
    }
  | {
      type: "SUBMIT_STARTED";
    }
  | {
      type: "COMPLETED";
    }
  | {
      type: "EXPIRED";
    }
  | {
      type: "FAILED";
      message: string;
      code?: string;
    }
  | {
      type: "RESET_ERROR";
    };

export const initialAssessmentFlowState: AssessmentFlowState = {
  status: "loading",
};

export const reduceAssessmentFlowState = (
  state: AssessmentFlowState,
  event: AssessmentFlowEvent,
): AssessmentFlowState => {
  switch (event.type) {
    case "LOAD_STARTED":
      return {
        ...state,
        status: "loading",
        error: undefined,
      };

    case "READY":
      return {
        ...state,
        status: "ready",
        sessionId: event.sessionId,
        assessmentId: event.assessmentId,
        expiresAt: event.expiresAt,
        error: undefined,
      };

    case "STARTED":
      return {
        ...state,
        status: "active",
        sessionId: event.sessionId,
        assessmentId: event.assessmentId,
        currentSectionId: event.currentSectionId,
        currentItemId: event.currentItemId,
        expiresAt: event.expiresAt,
        error: undefined,
      };

    case "SAVE_STARTED":
      return {
        ...state,
        status: "saving",
        previousStatus: state.status,
        error: undefined,
      };

    case "SAVE_SUCCEEDED":
      return {
        ...state,
        status: "saved",
        previousStatus: "active",
        lastSavedAt: event.savedAt,
        error: undefined,
      };

    case "SECTION_ENDED":
      return {
        ...state,
        status: "section-ended",
        currentSectionId: event.sectionId,
        error: undefined,
      };

    case "SUBMIT_STARTED":
      return {
        ...state,
        status: "submitting",
        error: undefined,
      };

    case "COMPLETED":
      return {
        ...state,
        status: "completed",
        error: undefined,
      };

    case "EXPIRED":
      return {
        ...state,
        status: "expired",
        error: undefined,
      };

    case "FAILED":
      return {
        ...state,
        status: "error",
        error: {
          message: event.message,
          code: event.code,
        },
      };

    case "RESET_ERROR":
      return {
        ...state,
        status: state.previousStatus ?? "ready",
        error: undefined,
      };

    default:
      return state;
  }
};

export const isAssessmentTerminalState = (
  status: AssessmentFlowStatus,
): boolean => {
  return status === "completed" || status === "expired";
};

export const canSaveAssessmentResponse = (
  status: AssessmentFlowStatus,
): boolean => {
  return status === "active" || status === "saved";
};

export const canSubmitAssessment = (
  status: AssessmentFlowStatus,
): boolean => {
  return status === "active" || status === "saved" || status === "section-ended";
};