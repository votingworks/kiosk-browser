import { debug, PostScriptPrinterDefinition } from '.';
import exec from '../exec';

/**
 * Configures a printer at a given device URI with a name and PPD. Optionally
 * sets the printer as the default printer too.
 */
export default async function configurePrinter({
  printerName,
  deviceURI,
  ppd,
  setDefault = false,
}: {
  printerName: string;
  deviceURI: string;
  ppd: PostScriptPrinterDefinition;
  setDefault?: boolean;
}): Promise<boolean | void> {
  const lpadminConfigureArgs = ['-p', printerName, '-v', deviceURI, '-E'];

  if ('path' in ppd) {
    lpadminConfigureArgs.push('-P', ppd.path);
  } else {
    lpadminConfigureArgs.push('-m', ppd.model);
  }

  debug('configuring printer with lpadmin: args=%o', lpadminConfigureArgs);
  await exec('lpadmin', lpadminConfigureArgs);

  if (setDefault) {
    const lpadminSetDefaultArgs = ['-d', printerName];
    debug(
      'setting printer as default with lpadmin: args=%o',
      lpadminSetDefaultArgs,
    );
    await exec('lpadmin', lpadminSetDefaultArgs);
  }
}
