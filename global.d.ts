declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean> | boolean;
      openSelectKey?: () => Promise<unknown> | void;
      // add more methods/properties here if exposed by aistudio
    };
  }
}

export {};
