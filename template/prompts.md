# prompts.md

## Chatbot used
- GitHub Copilot (model: GPT-5.3-Codex)

## Prompt history

### Prompt 1
Act as Expert software engineer.
Goal Create a polished, responsive two-panel interface (Stopwatch and Countdown) inspired by online-stopwatch.com. Use the provided seed index.html and script.js as the base. Implement all logic in vanilla JavaScript, with styling via Tailwind CSS. Follow SOLID principles, ensure robust error handling, and log meaningful messages to the console.
Requirements
• Structure
o HTML: index.html contains the seed markup with two panels (Stopwatch and Countdown). All UI elements must be accessible, labeled, and keyboard friendly.
o JavaScript: script.js contains all logic (no external libraries beyond Tailwind). Organize code to reflect SOLID principles with clear responsibilities:
 Timer models: StopwatchModel and CountdownModel (pure data/state).
 Controllers: StopwatchController and CountdownController (handle operations and state transitions).
 UI Layer: UIController (updates DOM, handles events, and business rules for the view).
 Utilities: TimeFormatter, InputValidator, Logger.
• Design and CSS
o Use Tailwind CSS for all styling. Match a look-and-feel inspired by online-stopwatch, with a modern digital display, readable digits, and clear controls.
o Ensure the layout is responsive (works on phones, tablets, and desktops). Use a grid/flex-based approach with appropriate Tailwind breakpoints.
o Include a playful, attractive title and description at the top, with a light-hearted tone.
• Accessibility
o All interactive controls must have aria-labels and be keyboard accessible.
o Display contrast and focus indicators must be clear.
• Features and behavior StopWatch Panel
o Buttons: Start, Stop/Pause, Reset.
o Display: minutes:seconds.centiseconds (HH:MM:SS.sss).
o Keyboard: Space/Enter to toggle Start/Stop when focused on the main control.
o Logging: Log start, stop, reset, and lap/tick events with timestamps.
o Optional: Lap functionality (if included, display laps in a list with times). CountDown Panel
o Input: Duration field supporting mm:ss or hh:mm:ss (configurable).
o Buttons: Start, Pause/Resume, Reset.
o Display: remaining time in the same format as the stopwatch.
o Validation: Non-numeric or out-of-range durations show a visible error state (red border) and an inline error message.
o Behavior: When finished, beep/notify (optional) and reset to a ready state after a short pause.
o Keyboard: Enter to Start when focused on the Start button; Esc to Reset if applicable.
o Logging: Log set duration, start, pause, resume, tick, and finish events.
• Robustness
o All actions wrapped in try/catch blocks; a global error boundary logs unexpected errors and shows a friendly UI notification if needed.
o Console logs for all major state changes, including construction of timers, interval creation, and cleanup.
• Extra considerations
o Provide a tiny, optional sound for countdown completion (Web Audio API) if you want to implement it; ensure it’s accessible and non-disruptive.
o Keep the seed HTML intact; only augment with required panels, controls, and IDs/classes necessary for functionality.

### Prompt 2
Please add keyboard behavior for the stopwatch:
- Press `Enter` to start the stopwatch.
- Press `Space` to pause the stopwatch.
- Press `Esc` to reset the stopwatch to `00:00:00.000`.

### Prompt 3 (final)
Please add the same behavior to the countdown:
- Press `Enter` to start the countdown.
- Press `Space` to pause/resume the countdown.
- Press `Esc` to reset the countdown.

## Notes
- Prompt 3 is the latest/final prompt applied.
- Prompt history is listed in chronological order.
