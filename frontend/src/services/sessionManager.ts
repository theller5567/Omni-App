type Listener = (open: boolean) => void;

let listeners: Listener[] = [];
let pendingResolver: ((result: boolean) => void) | null = null;

export function subscribeSessionPrompt(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function promptUserToContinueSession(): Promise<boolean> {
  // Show prompt in UI
  listeners.forEach((l) => l(true));
  return new Promise<boolean>((resolve) => {
    pendingResolver = resolve;
  });
}

export function resolveSessionPrompt(result: boolean): void {
  if (pendingResolver) {
    const resolve = pendingResolver;
    pendingResolver = null;
    resolve(result);
  }
  // Hide prompt in UI
  listeners.forEach((l) => l(false));
}


