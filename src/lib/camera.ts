/**
 * Singleton Camera Manager to prevent "Device in use" errors 
 * and manage clean context switching between features.
 */

let activeStream: MediaStream | null = null;
let isReleasing = false;
let isAcquiring = false;
let lastReleaseTime = 0;

const COOLDOWN_MS = 2500; // Increased to 2.5s for hardware release
const ACQUISITION_TIMEOUT = 15000; // 15s timeout

export const cameraManager = {
  async getStream(constraints: MediaStreamConstraints, retryCount = 0): Promise<MediaStream> {
    const startTime = Date.now();

    // 1. Wait if already busy
    while (isReleasing || isAcquiring) {
      if (Date.now() - startTime > ACQUISITION_TIMEOUT) {
        console.error('Camera Manager: Timeout waiting for lock. Forcing reset.');
        isAcquiring = false;
        isReleasing = false;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 2. Enforce minimum hardware cooldown
    const now = Date.now();
    const timeSinceRelease = now - lastReleaseTime;
    if (timeSinceRelease < COOLDOWN_MS) {
      const waitTime = COOLDOWN_MS - timeSinceRelease;
      console.log(`Camera Manager: Cooldown active, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    isAcquiring = true;

    try {
      // Hard stop any existing tracks
      this.stopStreamSync();
      
      // Brief delay after stopping before acquiring
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`Camera Manager: Requesting stream (Attempt ${retryCount + 1})`);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStream = stream;
      
      return stream;
    } catch (err: any) {
      console.error(`Camera Manager Error (Attempt ${retryCount + 1}):`, err.name, err.message);

      const isBusy = 
        err.name === 'NotReadableError' || 
        err.name === 'AbortError' || 
        err.message?.toLowerCase().includes('in use') ||
        err.message?.toLowerCase().includes('could not start') ||
        err.message?.toLowerCase().includes('hardware error');

      if (isBusy && retryCount < 5) {
        isAcquiring = false;
        // Exponential backoff
        const backoff = (2500 * Math.pow(1.6, retryCount)) + (Math.random() * 500);
        console.warn(`Camera Manager: Device busy, retrying in ${Math.round(backoff)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.getStream(constraints, retryCount + 1);
      }
      
      throw err;
    } finally {
      isAcquiring = false;
    }
  },

  /**
   * Stops the current stream and locks the manager until cooldown.
   */
  stopStream() {
    console.log('Camera Manager: Stopping stream and locking hardware cycle.');
    isReleasing = true;
    lastReleaseTime = Date.now();
    
    this.stopStreamSync();

    // Release the "releasing" lock after cooldown
    setTimeout(() => {
      isReleasing = false;
      console.log('Camera Manager: Hardware cycle complete.');
    }, COOLDOWN_MS);
  },

  /**
   * Synchronously stops all tracks.
   */
  stopStreamSync() {
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        try {
          track.enabled = false;
          track.stop();
        } catch (e) {
          console.error('Camera Manager: Error stopping track', e);
        }
      });
      activeStream = null;
    }
  }
};
