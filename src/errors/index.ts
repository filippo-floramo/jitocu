export class CLIError extends Error {
   constructor(
      message: string,
      public code: number = 1,
      public context?: any,
   ) {
      super(message);
      this.name = 'CLIError';
   }
}

export class ConfigError extends CLIError {
   constructor(message: string, context?: any) {
      super(message, 2, context);
      this.name = 'ConfigError';
   }
}

export class APIError extends CLIError {
   constructor(message: string, context?: any) {
      super(message, 3, context);
      this.name = 'APIError';
   }
}