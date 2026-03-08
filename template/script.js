"use strict";

class Logger {
	static now() {
		return new Date().toISOString();
	}

	static info(message, data = null) {
		if (data !== null) {
			console.log(`[${Logger.now()}] INFO: ${message}`, data);
			return;
		}
		console.log(`[${Logger.now()}] INFO: ${message}`);
	}

	static warn(message, data = null) {
		if (data !== null) {
			console.warn(`[${Logger.now()}] WARN: ${message}`, data);
			return;
		}
		console.warn(`[${Logger.now()}] WARN: ${message}`);
	}

	static error(message, error = null) {
		if (error) {
			console.error(`[${Logger.now()}] ERROR: ${message}`, error);
			return;
		}
		console.error(`[${Logger.now()}] ERROR: ${message}`);
	}
}

class TimeFormatter {
	static formatMilliseconds(totalMs) {
		const safeMs = Math.max(0, Math.floor(totalMs));
		const hours = Math.floor(safeMs / 3600000);
		const minutes = Math.floor((safeMs % 3600000) / 60000);
		const seconds = Math.floor((safeMs % 60000) / 1000);
		const milliseconds = safeMs % 1000;

		const hh = String(hours).padStart(2, "0");
		const mm = String(minutes).padStart(2, "0");
		const ss = String(seconds).padStart(2, "0");
		const sss = String(milliseconds).padStart(3, "0");
		return `${hh}:${mm}:${ss}.${sss}`;
	}
}

class InputValidator {
	static validateDuration(value) {
		const trimmed = String(value || "").trim();
		if (!trimmed) {
			return { isValid: false, error: "Please enter a duration first." };
		}

		const pattern = /^\d{1,2}:\d{2}(:\d{2})?$/;
		if (!pattern.test(trimmed)) {
			return { isValid: false, error: "Use mm:ss or hh:mm:ss format (e.g. 05:00 or 01:05:30)." };
		}

		const parts = trimmed.split(":").map((valuePart) => Number.parseInt(valuePart, 10));
		let hours = 0;
		let minutes = 0;
		let seconds = 0;

		if (parts.length === 2) {
			minutes = parts[0];
			seconds = parts[1];
		} else {
			hours = parts[0];
			minutes = parts[1];
			seconds = parts[2];
		}

		if ([hours, minutes, seconds].some((part) => Number.isNaN(part))) {
			return { isValid: false, error: "Duration contains invalid numbers." };
		}

		if (minutes > 59 || seconds > 59) {
			return { isValid: false, error: "Minutes and seconds must be between 00 and 59." };
		}

		const durationMs = ((hours * 3600) + (minutes * 60) + seconds) * 1000;
		if (durationMs <= 0) {
			return { isValid: false, error: "Duration must be greater than zero." };
		}

		if (durationMs > 99 * 3600 * 1000) {
			return { isValid: false, error: "Maximum supported duration is 99:59:59." };
		}

		return { isValid: true, durationMs, error: "" };
	}
}

class StopwatchModel {
	constructor() {
		this.elapsedMs = 0;
		this.isRunning = false;
		this.lastStartAt = null;
		this.laps = [];
	}
}

class CountdownModel {
	constructor() {
		this.initialDurationMs = 0;
		this.remainingMs = 0;
		this.isRunning = false;
		this.lastStartAt = null;
		this.isFinished = false;
	}
}

class StopwatchController {
	constructor(model, onTick, onLapUpdate) {
		this.model = model;
		this.onTick = onTick;
		this.onLapUpdate = onLapUpdate;
		this.intervalId = null;
		this.lastLoggedSecond = -1;
		Logger.info("StopwatchController constructed.");
	}

	start() {
		try {
			if (this.model.isRunning) {
				Logger.warn("Stopwatch start ignored because it is already running.");
				return;
			}

			this.model.lastStartAt = Date.now();
			this.model.isRunning = true;
			this.createInterval();
			Logger.info("Stopwatch started.");
		} catch (error) {
			Logger.error("Failed to start stopwatch.", error);
			throw error;
		}
	}

	pause() {
		try {
			if (!this.model.isRunning) {
				Logger.warn("Stopwatch pause ignored because it is not running.");
				return;
			}

			this.syncElapsedMs();
			this.model.isRunning = false;
			this.clearInterval();
			Logger.info("Stopwatch paused.");
		} catch (error) {
			Logger.error("Failed to pause stopwatch.", error);
			throw error;
		}
	}

	reset() {
		try {
			this.model.elapsedMs = 0;
			this.model.isRunning = false;
			this.model.lastStartAt = null;
			this.model.laps = [];
			this.lastLoggedSecond = -1;
			this.clearInterval();
			this.onTick(this.model.elapsedMs);
			this.onLapUpdate(this.model.laps);
			Logger.info("Stopwatch reset.");
		} catch (error) {
			Logger.error("Failed to reset stopwatch.", error);
			throw error;
		}
	}

	toggleRunState() {
		try {
			if (this.model.isRunning) {
				this.pause();
			} else {
				this.start();
			}
		} catch (error) {
			Logger.error("Failed to toggle stopwatch run state.", error);
			throw error;
		}
	}

	lap() {
		try {
			const currentMs = this.currentElapsedMs();
			this.model.laps = [currentMs, ...this.model.laps].slice(0, 30);
			this.onLapUpdate(this.model.laps);
			Logger.info("Stopwatch lap recorded.", { lapTime: TimeFormatter.formatMilliseconds(currentMs) });
		} catch (error) {
			Logger.error("Failed to record lap.", error);
			throw error;
		}
	}

	currentElapsedMs() {
		if (!this.model.isRunning || !this.model.lastStartAt) {
			return this.model.elapsedMs;
		}
		return this.model.elapsedMs + (Date.now() - this.model.lastStartAt);
	}

	syncElapsedMs() {
		this.model.elapsedMs = this.currentElapsedMs();
		this.model.lastStartAt = Date.now();
		this.onTick(this.model.elapsedMs);
	}

	createInterval() {
		this.clearInterval();
		this.intervalId = window.setInterval(() => {
			try {
				const nextMs = this.currentElapsedMs();
				this.onTick(nextMs);
				const nextSecond = Math.floor(nextMs / 1000);
				if (nextSecond !== this.lastLoggedSecond) {
					this.lastLoggedSecond = nextSecond;
					Logger.info("Stopwatch tick.", { elapsed: TimeFormatter.formatMilliseconds(nextMs) });
				}
			} catch (error) {
				Logger.error("Unexpected stopwatch tick error.", error);
			}
		}, 10);
		Logger.info("Stopwatch interval created.", { intervalId: this.intervalId });
	}

	clearInterval() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			Logger.info("Stopwatch interval cleared.", { intervalId: this.intervalId });
			this.intervalId = null;
		}
	}

	dispose() {
		this.clearInterval();
		Logger.info("Stopwatch controller disposed.");
	}
}

class CountdownController {
	constructor(model, onTick, onStateChange, onFinish) {
		this.model = model;
		this.onTick = onTick;
		this.onStateChange = onStateChange;
		this.onFinish = onFinish;
		this.intervalId = null;
		this.lastLoggedSecond = -1;
		Logger.info("CountdownController constructed.");
	}

	setDuration(durationMs) {
		try {
			this.model.initialDurationMs = durationMs;
			this.model.remainingMs = durationMs;
			this.model.isFinished = false;
			this.lastLoggedSecond = -1;
			this.onTick(this.model.remainingMs);
			this.onStateChange(this.model);
			Logger.info("Countdown duration set.", { duration: TimeFormatter.formatMilliseconds(durationMs) });
		} catch (error) {
			Logger.error("Failed to set countdown duration.", error);
			throw error;
		}
	}

	start() {
		try {
			if (this.model.isRunning) {
				Logger.warn("Countdown start ignored because it is already running.");
				return;
			}
			if (this.model.remainingMs <= 0) {
				Logger.warn("Countdown start ignored because remaining duration is zero.");
				return;
			}

			this.model.lastStartAt = Date.now();
			this.model.isRunning = true;
			this.model.isFinished = false;
			this.createInterval();
			this.onStateChange(this.model);
			Logger.info("Countdown started.");
		} catch (error) {
			Logger.error("Failed to start countdown.", error);
			throw error;
		}
	}

	pause() {
		try {
			if (!this.model.isRunning) {
				Logger.warn("Countdown pause ignored because it is not running.");
				return;
			}

			this.syncRemainingMs();
			this.model.isRunning = false;
			this.clearInterval();
			this.onStateChange(this.model);
			Logger.info("Countdown paused.");
		} catch (error) {
			Logger.error("Failed to pause countdown.", error);
			throw error;
		}
	}

	resume() {
		try {
			if (this.model.isRunning) {
				Logger.warn("Countdown resume ignored because it is already running.");
				return;
			}

			if (this.model.remainingMs <= 0) {
				Logger.warn("Countdown resume ignored because no time is remaining.");
				return;
			}

			this.model.lastStartAt = Date.now();
			this.model.isRunning = true;
			this.createInterval();
			this.onStateChange(this.model);
			Logger.info("Countdown resumed.");
		} catch (error) {
			Logger.error("Failed to resume countdown.", error);
			throw error;
		}
	}

	pauseOrResume() {
		try {
			if (this.model.isRunning) {
				this.pause();
			} else {
				this.resume();
			}
		} catch (error) {
			Logger.error("Failed to pause/resume countdown.", error);
			throw error;
		}
	}

	reset() {
		try {
			this.model.isRunning = false;
			this.model.lastStartAt = null;
			this.model.isFinished = false;
			this.model.remainingMs = this.model.initialDurationMs;
			this.lastLoggedSecond = -1;
			this.clearInterval();
			this.onTick(this.model.remainingMs);
			this.onStateChange(this.model);
			Logger.info("Countdown reset.");
		} catch (error) {
			Logger.error("Failed to reset countdown.", error);
			throw error;
		}
	}

	markReadyState() {
		try {
			this.model.isRunning = false;
			this.model.lastStartAt = null;
			this.model.isFinished = false;
			this.model.remainingMs = this.model.initialDurationMs;
			this.onTick(this.model.remainingMs);
			this.onStateChange(this.model);
			Logger.info("Countdown returned to ready state.");
		} catch (error) {
			Logger.error("Failed to move countdown to ready state.", error);
			throw error;
		}
	}

	currentRemainingMs() {
		if (!this.model.isRunning || !this.model.lastStartAt) {
			return this.model.remainingMs;
		}
		const passed = Date.now() - this.model.lastStartAt;
		return Math.max(0, this.model.remainingMs - passed);
	}

	syncRemainingMs() {
		this.model.remainingMs = this.currentRemainingMs();
		this.model.lastStartAt = Date.now();
		this.onTick(this.model.remainingMs);
	}

	createInterval() {
		this.clearInterval();
		this.intervalId = window.setInterval(() => {
			try {
				const nextMs = this.currentRemainingMs();
				this.onTick(nextMs);
				const nextSecond = Math.floor(nextMs / 1000);
				if (nextSecond !== this.lastLoggedSecond) {
					this.lastLoggedSecond = nextSecond;
					Logger.info("Countdown tick.", { remaining: TimeFormatter.formatMilliseconds(nextMs) });
				}

				if (nextMs <= 0) {
					this.model.remainingMs = 0;
					this.model.isRunning = false;
					this.model.isFinished = true;
					this.clearInterval();
					this.onStateChange(this.model);
					Logger.info("Countdown finished.");
					this.onFinish();
				}
			} catch (error) {
				Logger.error("Unexpected countdown tick error.", error);
			}
		}, 10);
		Logger.info("Countdown interval created.", { intervalId: this.intervalId });
	}

	clearInterval() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			Logger.info("Countdown interval cleared.", { intervalId: this.intervalId });
			this.intervalId = null;
		}
	}

	dispose() {
		this.clearInterval();
		Logger.info("Countdown controller disposed.");
	}
}

class UIController {
	constructor() {
		this.stopwatchDisplay = document.getElementById("stopwatchDisplay");
		this.stopwatchStartBtn = document.getElementById("stopwatchStartBtn");
		this.stopwatchPauseBtn = document.getElementById("stopwatchPauseBtn");
		this.stopwatchResetBtn = document.getElementById("stopwatchResetBtn");
		this.stopwatchLapBtn = document.getElementById("stopwatchLapBtn");
		this.stopwatchPanel = document.getElementById("stopwatchPanel");
		this.lapList = document.getElementById("lapList");

		this.countdownDisplay = document.getElementById("countdownDisplay");
		this.countdownInput = document.getElementById("countdownInput");
		this.countdownStartBtn = document.getElementById("countdownStartBtn");
		this.countdownPauseBtn = document.getElementById("countdownPauseBtn");
		this.countdownResetBtn = document.getElementById("countdownResetBtn");
		this.countdownPanel = document.getElementById("countdownPanel");
		this.countdownError = document.getElementById("countdownError");
		this.beepOnFinish = document.getElementById("beepOnFinish");

		this.globalNotice = document.getElementById("globalNotice");

		this.stopwatchController = new StopwatchController(
			new StopwatchModel(),
			(elapsedMs) => this.renderStopwatchTime(elapsedMs),
			(laps) => this.renderLaps(laps)
		);

		this.countdownController = new CountdownController(
			new CountdownModel(),
			(remainingMs) => this.renderCountdownTime(remainingMs),
			(model) => this.renderCountdownControls(model),
			() => this.handleCountdownFinished()
		);

		this.audioContext = null;

		this.renderStopwatchTime(0);
		this.renderCountdownTime(0);
		this.renderCountdownControls(this.countdownController.model);
		this.bindEvents();
		Logger.info("UIController initialized.");
	}

	bindEvents() {
		this.stopwatchStartBtn.addEventListener("click", () => this.guardAction(() => this.stopwatchController.start()));
		this.stopwatchPauseBtn.addEventListener("click", () => this.guardAction(() => this.stopwatchController.pause()));
		this.stopwatchResetBtn.addEventListener("click", () => this.guardAction(() => this.stopwatchController.reset()));
		this.stopwatchLapBtn.addEventListener("click", () => this.guardAction(() => this.stopwatchController.lap()));

		this.stopwatchPanel.addEventListener("keydown", (event) => {
			this.guardAction(() => {
				if (event.repeat) {
					return;
				}

				if (event.key === "Enter") {
					event.preventDefault();
					this.stopwatchController.start();
					Logger.info("Stopwatch keyboard shortcut executed.", { key: "Enter", action: "start" });
					return;
				}

				if (event.key === " " || event.key === "Spacebar") {
					event.preventDefault();
					this.stopwatchController.pause();
					Logger.info("Stopwatch keyboard shortcut executed.", { key: "Space", action: "pause" });
					return;
				}

				if (event.key === "Escape") {
					event.preventDefault();
					this.stopwatchController.reset();
					Logger.info("Stopwatch keyboard shortcut executed.", { key: "Escape", action: "reset" });
				}
			});
		});

		this.countdownStartBtn.addEventListener("click", () => this.guardAction(() => this.startCountdownFromInput()));
		this.countdownPauseBtn.addEventListener("click", () => this.guardAction(() => this.countdownController.pauseOrResume()));
		this.countdownResetBtn.addEventListener("click", () => this.guardAction(() => this.countdownController.reset()));

		this.countdownInput.addEventListener("input", () => {
			this.clearCountdownError();
		});

		this.countdownStartBtn.addEventListener("keydown", (event) => {
			this.guardAction(() => {
				if (event.key === "Enter") {
					event.preventDefault();
					this.startCountdownFromInput();
				}
			});
		});

		this.countdownPanel.addEventListener("keydown", (event) => {
			this.guardAction(() => {
				if (event.repeat) {
					return;
				}

				if (event.key === "Enter") {
					event.preventDefault();
					this.startCountdownFromInput();
					Logger.info("Countdown keyboard shortcut executed.", { key: "Enter", action: "start" });
					return;
				}

				if (event.key === " " || event.key === "Spacebar") {
					event.preventDefault();
					this.countdownController.pauseOrResume();
					Logger.info("Countdown keyboard shortcut executed.", { key: "Space", action: "pause-or-resume" });
					return;
				}

				if (event.key === "Escape") {
					event.preventDefault();
					this.countdownController.reset();
					Logger.info("Countdown keyboard shortcut executed.", { key: "Escape", action: "reset" });
				}
			});
		});

		window.addEventListener("beforeunload", () => {
			this.stopwatchController.dispose();
			this.countdownController.dispose();
		});
	}

	guardAction(action) {
		try {
			action();
		} catch (error) {
			Logger.error("Unhandled UI action error.", error);
			this.showGlobalNotice("Something went wrong. Please try again.");
		}
	}

	renderStopwatchTime(elapsedMs) {
		this.stopwatchDisplay.textContent = TimeFormatter.formatMilliseconds(elapsedMs);
	}

	renderCountdownTime(remainingMs) {
		this.countdownDisplay.textContent = TimeFormatter.formatMilliseconds(remainingMs);
	}

	renderLaps(laps) {
		this.lapList.innerHTML = "";
		if (laps.length === 0) {
			const emptyItem = document.createElement("li");
			emptyItem.className = "text-slate-400";
			emptyItem.textContent = "No laps yet. Hit Lap while running.";
			this.lapList.appendChild(emptyItem);
			return;
		}

		laps.forEach((lapMs, index) => {
			const item = document.createElement("li");
			item.className = "flex items-center justify-between rounded bg-white px-2 py-1";
			const lapNumber = laps.length - index;
			item.innerHTML = `<span class="font-medium">Lap ${lapNumber}</span><span class="font-mono">${TimeFormatter.formatMilliseconds(lapMs)}</span>`;
			this.lapList.appendChild(item);
		});
	}

	renderCountdownControls(model) {
		this.countdownPauseBtn.textContent = model.isRunning ? "Pause" : "Resume";
		if (model.isFinished) {
			this.countdownPauseBtn.textContent = "Pause";
		}
	}

	startCountdownFromInput() {
		const validation = InputValidator.validateDuration(this.countdownInput.value);
		if (!validation.isValid) {
			this.showCountdownError(validation.error);
			Logger.warn("Countdown duration validation failed.", { input: this.countdownInput.value, error: validation.error });
			return;
		}

		this.clearCountdownError();
		this.countdownController.setDuration(validation.durationMs);
		this.countdownController.start();
	}

	showCountdownError(message) {
		this.countdownError.textContent = message;
		this.countdownError.classList.remove("hidden");
		this.countdownInput.classList.remove("border-slate-300", "focus-visible:ring-sky-300");
		this.countdownInput.classList.add("border-rose-500", "focus-visible:ring-rose-300");
		this.countdownInput.setAttribute("aria-invalid", "true");
	}

	clearCountdownError() {
		this.countdownError.textContent = "";
		this.countdownError.classList.add("hidden");
		this.countdownInput.classList.remove("border-rose-500", "focus-visible:ring-rose-300");
		this.countdownInput.classList.add("border-slate-300", "focus-visible:ring-sky-300");
		this.countdownInput.removeAttribute("aria-invalid");
	}

	showGlobalNotice(message) {
		this.globalNotice.textContent = message;
		this.globalNotice.classList.remove("hidden");
		window.setTimeout(() => {
			this.globalNotice.classList.add("hidden");
			this.globalNotice.textContent = "";
		}, 2500);
	}

	handleCountdownFinished() {
		try {
			this.showGlobalNotice("Countdown complete! Nice work 🎉");
			this.playCompletionBeep();
			window.setTimeout(() => {
				this.guardAction(() => this.countdownController.markReadyState());
			}, 1200);
		} catch (error) {
			Logger.error("Failed to process countdown finish workflow.", error);
		}
	}

	playCompletionBeep() {
		try {
			if (!this.beepOnFinish.checked) {
				return;
			}

			this.audioContext = this.audioContext || new window.AudioContext();
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.type = "sine";
			oscillator.frequency.value = 880;
			gainNode.gain.value = 0.08;

			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			const startAt = this.audioContext.currentTime;
			oscillator.start(startAt);
			oscillator.stop(startAt + 0.15);
			Logger.info("Countdown completion beep played.");
		} catch (error) {
			Logger.warn("Could not play completion beep.", error);
		}
	}
}

function setupGlobalErrorBoundary() {
	window.addEventListener("error", (event) => {
		Logger.error("Global error captured.", event.error || event.message);
		const notice = document.getElementById("globalNotice");
		if (notice) {
			notice.textContent = "Unexpected error detected. Check console logs for details.";
			notice.classList.remove("hidden");
		}
	});

	window.addEventListener("unhandledrejection", (event) => {
		Logger.error("Unhandled promise rejection captured.", event.reason);
		const notice = document.getElementById("globalNotice");
		if (notice) {
			notice.textContent = "Unexpected async error detected. Check console logs for details.";
			notice.classList.remove("hidden");
		}
	});
}

function bootstrapApp() {
	try {
		setupGlobalErrorBoundary();
		new UIController();
		Logger.info("Application bootstrapped successfully.");
	} catch (error) {
		Logger.error("Fatal bootstrap error.", error);
		const notice = document.getElementById("globalNotice");
		if (notice) {
			notice.textContent = "App failed to initialize. Please refresh the page.";
			notice.classList.remove("hidden");
		}
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", bootstrapApp);
} else {
	bootstrapApp();
}

