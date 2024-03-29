import exec from '../exec';
import mockOf from '../../../test/mockOf';
import { fakeIpptoolStdout, fakeMarkerInfo } from '../../../test/fakePrinter';
import { getPrinterIppAttributes } from './getPrinterIppAttributes';

jest.mock('../exec');

const ippUri = 'ipp://localhost:60000/ipp/print';

describe('getPrinterIppAttributes', () => {
  it('uses ipptool to query and parse printer atttributes', async () => {
    mockOf(exec).mockResolvedValueOnce({
      stdout: fakeIpptoolStdout(),
      stderr: '',
    });
    expect(await getPrinterIppAttributes(ippUri)).toEqual({
      state: 'idle',
      stateReasons: ['none'],
      markerInfos: [fakeMarkerInfo],
    });
  });

  it('parses multiple marker infos', async () => {
    mockOf(exec).mockResolvedValueOnce({
      stdout: fakeIpptoolStdout({
        'marker-names':
          '(1setOf nameWithoutLanguage) = black cartridge,color cartridge',
        'marker-types': '(1setOf keyword) = toner-cartridge,toner-cartridge',
        'marker-colors': '(1setOf nameWithoutLanguage) = #000000,#ffffff',
        'marker-low-levels': '(1setOf integer) = 2,2',
        'marker-high-levels': '(1setOf integer) = 100,100',
        'marker-levels': '(1setOf integer) = 100,83',
      }),
      stderr: '',
    });
    expect(await getPrinterIppAttributes(ippUri)).toEqual({
      state: 'idle',
      stateReasons: ['none'],
      markerInfos: [
        fakeMarkerInfo,
        {
          name: 'color cartridge',
          type: 'toner-cartridge',
          color: '#ffffff',
          lowLevel: 2,
          highLevel: 100,
          level: 83,
        },
      ],
    });
  });

  it('parses multiple printer-state-reasons', async () => {
    mockOf(exec).mockResolvedValueOnce({
      stdout: fakeIpptoolStdout({
        'printer-state': '(enum) = stopped',
        'printer-state-reasons':
          '(1setOf keyword) = media-empty-error,media-needed-error,media-empty-error',
      }),
      stderr: '',
    });
    expect(await getPrinterIppAttributes(ippUri)).toEqual({
      state: 'stopped',
      stateReasons: [
        'media-empty-error',
        'media-needed-error',
        'media-empty-error',
      ],
      markerInfos: [fakeMarkerInfo],
    });
  });

  it('creates a special printer-state-reason if HP sleep mode detected', async () => {
    mockOf(exec).mockResolvedValueOnce({
      stdout: fakeIpptoolStdout({
        'printer-alert-description':
          '(1setOf textWithoutLanguage) = ,Ready,Sleep Mode',
      }),
      stderr: '',
    });
    expect(await getPrinterIppAttributes(ippUri)).toEqual({
      state: 'idle',
      stateReasons: ['sleep-mode'],
      markerInfos: [fakeMarkerInfo],
    });
  });

  it('throws an error if ipptool fails', async () => {
    mockOf(exec).mockRejectedValueOnce(new Error('ipptool failed'));
    await expect(getPrinterIppAttributes(ippUri)).rejects.toThrow(
      new Error('ipptool failed'),
    );
  });

  it('throws an error if ipptool output cannot be parsed', async () => {
    const badOutput = [
      ['', 'Unsuccessful ipptool response: '],
      [
        `"/tmp/tmp-122141-YkVU4ekfP1Eg":
  Get-Printer-Attributes:
      attributes-charset (charset) = utf-8
      attributes-natural-language (naturalLanguage) = en
      printer-uri (uri) = ipp://localhost:60000/ipp/print
      requested-attributes (1setOf keyword) = printer-state,printer-state-reasons,marker-names,marker-colors,marker-types,marker-low-levels,marker-high-levels,marker-levels,printer-alert-description
  /tmp/tmp-122141-YkVU4ekfP1Eg                                         [PASS]
      RECEIVED: 395 bytes in response
      status-code = successful-ok ((null))
`,
        'Unsuccessful ipptool response: status-code = successful-ok ((null))',
      ],
      [
        `"/tmp/tmp-122141-YkVU4ekfP1Eg":
  Get-Printer-Attributes:
      attributes-charset (charset) = utf-8
      attributes-natural-language (naturalLanguage) = en
      printer-uri (uri) = ipp://localhost:60000/ipp/print
      requested-attributes (1setOf keyword) = printer-state,printer-state-reasons,marker-names,marker-colors,marker-types,marker-low-levels,marker-high-levels,marker-levels,printer-alert-description
  /tmp/tmp-122141-YkVU4ekfP1Eg                                         [PASS]
      RECEIVED: 395 bytes in response`,
        'Unsuccessful ipptool response: <empty>',
      ],
      [
        `"/tmp/tmp-122141-YkVU4ekfP1Eg":
  Get-Printer-Attributes:
      attributes-charset (charset) = utf-8
      attributes-natural-language (naturalLanguage) = en
      printer-uri (uri) = ipp://localhost:60000/ipp/print
      requested-attributes (1setOf keyword) = printer-state,printer-state-reasons,marker-names,marker-colors,marker-types,marker-low-levels,marker-high-levels,marker-levels,printer-alert-description
  /tmp/tmp-122141-YkVU4ekfP1Eg                                         [PASS]
      RECEIVED: 395 bytes in response
      status-code = successful-ok (successful-ok)`,
        'false == true', // Assertion fail
      ],
      [
        `"/tmp/tmp-122141-YkVU4ekfP1Eg":
  Get-Printer-Attributes:
      attributes-charset (charset) = utf-8
      attributes-natural-language (naturalLanguage) = en
      printer-uri (uri) = ipp://localhost:60000/ipp/print
      requested-attributes (1setOf keyword) = printer-state,printer-state-reasons,marker-names,marker-colors,marker-types,marker-low-levels,marker-high-levels,marker-levels,printer-alert-description
  /tmp/tmp-122141-YkVU4ekfP1Eg                                         [PASS]
      RECEIVED: 395 bytes in response
      status-code = successful-ok (successful-ok)
      attributes-charset (charset) = utf-8`,
        'false == true', // Assertion fail
      ],
      [
        fakeIpptoolStdout({ 'printer-state': '(enum) = ' }),
        'Unable to parse ipptool output line: printer-state (enum) =',
      ],
      [
        fakeIpptoolStdout({ 'printer-state': '(badType) = idle' }),
        'Unrecognized ipptool attribute type: badType',
      ],
    ];
    for (const [stdout, expectedError] of badOutput) {
      mockOf(exec).mockResolvedValueOnce({ stdout, stderr: '' });
      await expect(getPrinterIppAttributes(ippUri)).rejects.toThrow(
        new Error(expectedError),
      );
    }
  });
});
