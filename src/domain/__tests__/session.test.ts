import { describe, expect, test } from "bun:test";
import {
  TARGET,
  LIMIT_MS,
  newSession,
  settle,
  tap,
  undo,
  needsConfirm,
  confirmDone,
  isCurrent,
  type Session,
} from "../session";

describe("session domain logic", () => {
  const MOCK_NOW = 1700000000000;
  const TWO_HOURS = LIMIT_MS;

  describe("newSession", () => {
    test("creates active session with current date and time", () => {
      const session = newSession(MOCK_NOW);
      expect(session.status).toBe("active");
      expect(session.startedAt).toBe(MOCK_NOW);
      expect(session.kicks).toEqual([]);
      // Date depends on system locale, just ensure it's a string
      expect(typeof session.date).toBe("string");
    });
  });

  describe("settle", () => {
    test("keeps session active if within time limit", () => {
      const activeSession: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [],
        status: "active",
      };

      const result = settle(activeSession, MOCK_NOW + TWO_HOURS - 1);
      expect(result.status).toBe("active");
      expect(result.endedAt).toBeUndefined();
    });

    test("marks session done if time limit exceeded", () => {
      const activeSession: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [],
        status: "active",
      };

      const result = settle(activeSession, MOCK_NOW + TWO_HOURS);
      expect(result.status).toBe("done");
      expect(result.endedAt).toBe(MOCK_NOW + TWO_HOURS);
    });

    test("ignores already done session", () => {
      const doneSession: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        endedAt: MOCK_NOW + 1000,
        kicks: [],
        status: "done",
      };

      const result = settle(doneSession, MOCK_NOW + TWO_HOURS * 2);
      expect(result.status).toBe("done");
      // Must not modify endedAt
      expect(result.endedAt).toBe(doneSession.endedAt);
    });
  });

  describe("tap", () => {
    test("adds a kick to active session", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [],
        status: "active",
      };

      const result = tap(session, MOCK_NOW + 100);
      expect(result.kicks).toEqual([MOCK_NOW + 100]);
    });

    test("settles session if time limit exceeded instead of adding kick", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [MOCK_NOW + 100],
        status: "active",
      };

      const lateNow = MOCK_NOW + TWO_HOURS + 100;
      const result = tap(session, lateNow);

      // Should be settled and NOT add the tap as a kick
      expect(result.status).toBe("done");
      expect(result.kicks.length).toBe(1);
    });

    test("ignores tap if target reached", () => {
      // Setup a session with 10 kicks
      const kicks = Array(TARGET).fill(MOCK_NOW + 100);
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks,
        status: "active",
      };

      const result = tap(session, MOCK_NOW + 200);
      expect(result.kicks.length).toBe(TARGET);
      expect(result.kicks).toEqual(kicks);
    });

    test("ignores tap on already done session", () => {
      const doneSession: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [],
        status: "done",
      };

      const result = tap(doneSession, MOCK_NOW + 100);
      expect(result.kicks.length).toBe(0);
    });
  });

  describe("undo", () => {
    test("removes last kick from active session", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [MOCK_NOW + 100, MOCK_NOW + 200],
        status: "active",
      };

      const result = undo(session);
      expect(result.kicks).toEqual([MOCK_NOW + 100]);
    });

    test("does nothing if kicks empty", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [],
        status: "active",
      };

      const result = undo(session);
      expect(result.kicks).toEqual([]);
    });

    test("does nothing if session done", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [MOCK_NOW + 100, MOCK_NOW + 200],
        status: "done",
      };

      const result = undo(session);
      // Still has 2 kicks
      expect(result.kicks.length).toBe(2);
    });
  });

  describe("needsConfirm", () => {
    test("true when active and target reached", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: Array(TARGET).fill(MOCK_NOW + 100),
        status: "active",
      };

      expect(needsConfirm(session)).toBe(true);
    });

    test("false when active but target not reached", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: Array(TARGET - 1).fill(MOCK_NOW + 100),
        status: "active",
      };

      expect(needsConfirm(session)).toBe(false);
    });

    test("false when session already done", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: Array(TARGET).fill(MOCK_NOW + 100),
        status: "done",
      };

      expect(needsConfirm(session)).toBe(false);
    });
  });

  describe("confirmDone", () => {
    test("marks session done and sets endedAt to the 10th kick time", () => {
      const targetTime = MOCK_NOW + 1000;
      const kicks = Array(TARGET - 1).fill(MOCK_NOW + 100);
      kicks.push(targetTime); // The 10th kick

      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks,
        status: "active",
      };

      const result = confirmDone(session);

      expect(result.status).toBe("done");
      expect(result.endedAt).toBe(targetTime);
    });
  });

  describe("isCurrent", () => {
    test("true if date matches today", () => {
      const session: Session = {
        date: "2023-11-15",
        startedAt: MOCK_NOW,
        kicks: [],
        status: "done",
      };

      expect(isCurrent(session, "2023-11-15")).toBe(true);
    });

    test("true if status is active (crosses midnight)", () => {
      const session: Session = {
        date: "2023-11-14", // Yesterday
        startedAt: MOCK_NOW,
        kicks: [],
        status: "active",
      };

      expect(isCurrent(session, "2023-11-15")).toBe(true);
    });

    test("false if older date and already done", () => {
      const session: Session = {
        date: "2023-11-14", // Yesterday
        startedAt: MOCK_NOW,
        kicks: [],
        status: "done",
      };

      expect(isCurrent(session, "2023-11-15")).toBe(false);
    });
  });
});