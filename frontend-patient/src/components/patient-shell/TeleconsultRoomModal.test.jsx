/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeleconsultRoomModal } from "./TeleconsultRoomModal";

afterEach(() => cleanup());

const baseConsult = {
  id: 21,
  mode: "video",
  status: "scheduled",
  preferredSlot: "2026-03-30T10:00:00.000Z",
  phone: "9876543210",
  concern: "Fever follow up and medication review",
  meetingUrl: "https://meet.jit.si/SehatSaathi-Consult-21#config.prejoinPageEnabled=false&config.disableDeepLinking=true",
};

function renderModal(overrides = {}) {
  const props = {
    consult: baseConsult,
    closeTeleconsultRoom: vi.fn(),
    teleStatusLabel: (status) => status,
    consultMessages: [],
    consultConsentSummary: { patientAccepted: true, patientAcceptedAt: "2026-03-29T10:00:00.000Z" },
    acceptConsultConsent: vi.fn(),
    consultMessageText: "",
    setConsultMessageText: vi.fn(),
    sendConsultMessage: vi.fn((event) => event?.preventDefault?.()),
    consultMessageStatus: "",
    ...overrides,
  };
  render(<TeleconsultRoomModal {...props} />);
  return props;
}

describe("TeleconsultRoomModal", () => {
  it("shows a join room link when consent is accepted", () => {
    renderModal({
      authToken: "token",
      apiBase: "http://localhost:8080",
      currentUserId: 21,
    });
    expect(screen.getByRole("button", { name: "Join video" })).toBeEnabled();
    expect(screen.getByText("Your camera")).toBeInTheDocument();
  });

  it("keeps room actions locked until consent is accepted", () => {
    renderModal({
      authToken: "token",
      apiBase: "http://localhost:8080",
      currentUserId: 21,
      consultConsentSummary: { patientAccepted: false, patientAcceptedAt: null },
    });
    expect(screen.getByRole("button", { name: "Join video" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mute" })).toBeDisabled();
    expect(screen.getByText("Accept the teleconsult notice to unlock live video.")).toBeInTheDocument();
  });

  it("shows doctor media placeholder once consent is accepted", () => {
    renderModal({
      authToken: "token",
      apiBase: "http://localhost:8080",
      currentUserId: 21,
    });
    expect(screen.getByText("Doctor")).toBeInTheDocument();
    expect(screen.getByText("As soon as the doctor joins, their live stream will appear here.")).toBeInTheDocument();
  });
});
