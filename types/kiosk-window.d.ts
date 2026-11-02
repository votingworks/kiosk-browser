declare namespace KioskBrowser {
  export interface Kiosk {
    log(message: string): Promise<void>;

    showOpenDialog(
      options?: import('electron').OpenDialogOptions,
    ): Promise<import('electron').OpenDialogReturnValue>;

    reboot(): Promise<void>;
  }
}

declare let kiosk: KioskBrowser.Kiosk | undefined;
