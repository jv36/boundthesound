// Ensures only one song preview ever plays at a time across the whole app. Each
// AudioPlayer registers a "stop" callback before it starts playing; if another
// player is already registered, it gets stopped first.

let activeStop: (() => void) | null = null

/** Call right before starting playback. Stops whatever else is currently playing. */
export function notifyPlaying(stop: () => void): void {
  if (activeStop && activeStop !== stop) activeStop()
  activeStop = stop
}

/** Call when playback ends/pauses/unmounts so this player is no longer tracked as active. */
export function notifyStopped(stop: () => void): void {
  if (activeStop === stop) activeStop = null
}
