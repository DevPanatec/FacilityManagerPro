interface RetryOptions {
  retries: number;
  factor: number;
  minTimeout: number;
  maxTimeout: number;
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;
  let attempt = 0;

  const backoff = (attempt: number): number => {
    const ms = Math.min(
      options.minTimeout * Math.pow(options.factor, attempt),
      options.maxTimeout
    );
    return ms;
  };

  while (attempt < options.retries) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      attempt++;
      
      if (attempt === options.retries) {
        break;
      }

      // Añadir el número de intento al error para el registro
      error.attemptCount = attempt;

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, backoff(attempt)));
    }
  }

  throw lastError;
} 