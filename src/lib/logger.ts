export const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

export const debugGroup = (label: string, logFn: () => void) => {
  if (process.env.NODE_ENV !== 'production') {
    console.groupCollapsed(label);
    try {
      logFn();
    } finally {
      console.groupEnd();
    }
  }
};
