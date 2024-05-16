declare namespace KioskBrowser {
  export interface SaveAsOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: FileFilter[];
  }

  export interface FileWriter {
    /**
     * Writes a chunk to the file. May be called multiple times. Data will be
     * written in the order of calls to `write`.
     */
    write(data: Uint8Array | string): Promise<void>;

    /**
     * Finishes writing to the file and closes it. Subsequent calls to `write`
     * will fail. Resolves when the file is successfully closed.
     */
    end(): Promise<void>;

    filename: string;
  }

  export interface Kiosk {
    log(message: string): Promise<void>;
    quit(): void;

    /**
     * Opens a Save Dialog to allow the user to choose a destination for a file.
     * Once chosen, resolves with a handle to the file to write data to it.
     */
    saveAs(options?: SaveAsOptions): Promise<FileWriter | undefined>;

    showOpenDialog(
      options?: import('electron').OpenDialogOptions,
    ): Promise<import('electron').OpenDialogReturnValue>;

    showSaveDialog(
      options?: import('electron').SaveDialogOptions,
    ): Promise<import('electron').SaveDialogReturnValue>;

    captureScreenshot(): Promise<Buffer>;
  }
}

declare let kiosk: KioskBrowser.Kiosk | undefined;
