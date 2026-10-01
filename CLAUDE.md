# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install dependencies:** `bun install`
- **Start development server:** `bun run dev`
- **Build for production:** `bun run build`
- **Lint code:** `bun run lint` (uses `oxlint`)

*(Note: There is currently no testing framework configured.)*

## Architecture and Context

- **App Purpose:** "Baby Kick Count" (KickCount). A mobile-first PWA tool to count baby kicks.
- **Language:** UI language is Indonesian.
- **Tech Stack:** React 19, TypeScript, Vite, packaged and run with Bun. Pure frontend architecture.
- **Storage:** Data is persisted client-side using pure **IndexedDB** (no wrappers/libraries).
- **Core Principles:** 
  - **Offline capability:** Must work entirely offline as a PWA.
  - **No Medical Advice:** The app is strictly a tracking tool. It does not provide diagnoses, medical advice, alerts, or interpretation of normality.
  - **UX/UI:** Mobile-first, thumb-friendly design. Features include sound/vibration feedback on tap, keeping the screen awake during active sessions, and explicit lack of animations (to support motion-sensitive users). Follows system dark/light mode preferences.
- **Documentation:** Refer to `plan.md` for detailed product specifications, UX principles, and recording rules (e.g., 1 session per day, target of 10 movements within a 2-hour window).
