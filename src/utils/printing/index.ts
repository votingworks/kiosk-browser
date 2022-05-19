import makeDebug from 'debug';

export const debug = makeDebug('kiosk-browser:printing');

export interface PrintConfig {
  printerName: string;
  printers: Printer[];
}

export interface Printer {
  label: string;
  vendorId: number;
  productId: number;
  baseDeviceURI: string;
  ppd: PostScriptPrinterDefinition;
}

export type PostScriptPrinterDefinition =
  | FilePostScriptPrinterDefinition
  | ModelPostScriptPrinterDefinition;

export interface FilePostScriptPrinterDefinition {
  /**
   * Path to a `.ppd` file for a given printer.
   */
  path: string;
}

export interface ModelPostScriptPrinterDefinition {
  /**
   * Name of a well-known printer definition.
   */
  model: string;
}
