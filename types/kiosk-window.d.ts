declare namespace KioskBrowser {
  export interface Kiosk {
    log(message: string): Promise<void>;
    quit(): void;

    showOpenDialog(
      options?: import('electron').OpenDialogOptions,
    ): Promise<import('electron').OpenDialogReturnValue>;

    captureScreenshot(): Promise<Uint8Array>;
  }
}

declare let kiosk: KioskBrowser.Kiosk | undefined;
