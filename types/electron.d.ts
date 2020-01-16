declare namespace Electron {
  interface PrinterInfo {
    /**
     * Add printer options such as `printer-is-accepting-jobs`.
     */
    options?: { [key: string]: string }
  }
}
