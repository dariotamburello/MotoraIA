/**
 * Cola serial de comandos para el protocolo ELM327.
 *
 * El ELM327 es un dispositivo single-threaded: si recibe un segundo comando
 * antes de responder al primero, se cuelga indefinidamente. Esta cola garantiza
 * que solo un comando esté en tránsito en cualquier momento.
 *
 * Uso:
 *   const result = await queue.enqueue(() => strategy.sendCommand('010C'));
 */
export class CommandQueue {
  private running = false;
  private readonly pending: Array<() => Promise<unknown>> = [];

  /**
   * Encola una tarea y retorna su resultado cuando sea ejecutada.
   * La tarea se ejecuta en orden FIFO, una a la vez.
   */
  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.push(async () => {
        try {
          resolve(await task());
        } catch (err) {
          reject(err);
        }
      });
      void this.drain();
    });
  }

  /** Drena la cola procesando una tarea a la vez. */
  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    while (this.pending.length > 0) {
      const task = this.pending.shift()!;
      await task();
    }
    this.running = false;
  }

  /**
   * Descarta todas las tareas pendientes (no la que está en ejecución).
   * Útil al detener el polling o al desconectar.
   */
  clear(): void {
    this.pending.length = 0;
  }
}
