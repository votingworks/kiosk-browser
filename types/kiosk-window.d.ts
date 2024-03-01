declare namespace KioskBrowser {
  export interface BatteryInfo {
    discharging: boolean;
    level: number; // Number between 0–1
  }

  export type PrintSides =
    /**
     * One page per sheet, aka simplex or "Duplex=None".
     */
    | 'one-sided'

    /**
     * Two pages per sheet, aka "Duplex=DuplexNoTumble". This option prints such
     * that a right-side up portrait sheet flipped over on the long edge remains
     * right-side up, i.e. a regular left-to-right book.
     */
    | 'two-sided-long-edge'

    /**
     * Two pages per sheet, aka "Duplex=DuplexTumble". This option prints such
     * that a right-side up portrait sheet flipped over on the short edge remains
     * right-side up, i.e. a bound-at-the-top ring binder.
     */
    | 'two-sided-short-edge';

  export interface PrintOptions {
    deviceName?: string;
    paperSource?: string;
    copies?: number;
    sides?: PrintSides;
    raw?: { [key: string]: string };
  }

  /**
   * IPP printer-state-reasons explain what's going on with a printer in detail.
   * Spec: https://datatracker.ietf.org/doc/html/rfc2911#section-4.4.12
   * For a partial list of common printer-state-reasons, see
   * getPrinterIppAttributes.ts in kiosk-browser. Since we don't know all
   * possible reasons, we just type as string.
   */
  export type IppPrinterStateReason = string;

  /**
   * "Marker" is a general name for ink/toner/etc. CUPS implements a variety of
   * marker-related IPP attributes prefixed with "marker-", e.g. "marker-levels".
   * Spec: https://www.cups.org/doc/spec-ipp.html
   */
  export interface IppMarkerInfo {
    name: string; // e.g. "black cartridge"
    color: string; // e.g. "#000000"
    type: string; // e.g. "toner-cartridge"
    lowLevel: number; // e.g. 2
    highLevel: number; // e.g. 100
    level: number; // e.g. 83
  }

  /**
   * A collection of status info about a printer we get via IPP.
   */
  export type PrinterIppAttributes =
    | { state: 'unknown' } // We didn't get a response from the printer
    | {
        state: 'idle' | 'processing' | 'stopped';
        stateReasons: IppPrinterStateReason[];
        markerInfos: IppMarkerInfo[];
      };

  interface PrinterInfoBase {
    // Docs: http://electronjs.org/docs/api/structures/printer-info
    description: string;
    isDefault: boolean;
    name: string;
    options?: { [key: string]: string };
    // Added via kiosk-browser
    connected: boolean;
  }
  /**
   * The printer's basic info we get from Electron (e.g. name, description,
   * options), plus its connection status and IPP attributes.
   */
  export type PrinterInfo = Omit<Electron.PrinterInfo, 'status'> &
    PrinterIppAttributes & {
      connected: boolean;
    };

  export interface Device {
    locationId: number;
    vendorId: number;
    productId: number;
    deviceName: string;
    manufacturer: string;
    serialNumber: string;
    deviceAddress: number;
  }

  export interface SaveAsOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: FileFilter[];
  }

  export interface FileFilter {
    // Docs: http://electronjs.org/docs/api/structures/file-filter
    extensions: string[];
    name: string;
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

  export interface SetClockParams {
    isoDatetime: string;
    IANAZone: string;
  }

  export interface Observable<T> {
    subscribe(callback: (value: T) => void): () => void;
  }

  export interface Kiosk {
    print(options?: PrintOptions): Promise<void>;
    getPrinterInfo(): Promise<PrinterInfo[]>;

    /**
     * Prints the current page to PDF and resolves with the PDF file bytes.
     */
    printToPDF(): Promise<Uint8Array>;
    log(message: string): Promise<void>;

    getBatteryInfo(): Promise<BatteryInfo | undefined>;
    devices: Observable<Iterable<Device>>;
    printers: Observable<Iterable<PrinterInfo>>;
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
