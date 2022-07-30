import { parsePrinterOptions, getPrinterOptions } from './options';
import exec from '../exec';
import mockOf from '../../../test/mockOf';

jest.mock('../exec');

const execMock = mockOf(exec);

beforeEach(() => {
  execMock.mockRestore();
});

test('parse empty options', () => {
  expect(parsePrinterOptions('')).toEqual({});
});

test('no default', () => {
  expect(parsePrinterOptions('Opt/Option Name: A B')).toEqual({
    Opt: {
      key: 'Opt',
      label: 'Option Name',
      values: ['A', 'B'],
    },
  });
});

test('full option set', () => {
  expect(
    parsePrinterOptions(
      `
PageSize/Media Size: *Letter Legal Executive Statement FanFoldGermanLegal 4x6 5x8 A4 A5 A6 B5 B6 102x152mm Oficio 195x270mm 184x260mm 7.75x10.75 Postcard DoublePostcardRotated Env10 EnvMonarch EnvISOB5 EnvC5 EnvDL Custom.WIDTHxHEIGHT
Collate/Collate: True *False
Duplex/Two-Sided: *None DuplexNoTumble DuplexTumble
InputSlot/Paper Feed: *Auto Tray1 Tray2 Tray3 ManualFeed
HPOption_Tray3/Tray 3: *False True
HPOption_Duplexer/Duplex Unit: True *False
HPOption_JobStorage/Job Storage: *False True
MediaType/Media Type: *Unspecified Plain HPEcoFFICIENT Light6074 Intermediate8595 MidWeight96110 Heavy111130 ExtraHeavy131175 Labels Letterhead Envelope Preprinted Prepunched Colored Bond Recycled Rough
HPPJLPrintQuality/Print Quality: *Normal Economode
HPPinPrnt/Secure Printing: True *False
HPFIDigit/First Digit: *0 1 2 3 4 5 6 7 8 9
HPSEDigit/Second Digit: *0 1 2 3 4 5 6 7 8 9
HPTHDigit/Third Digit: *0 1 2 3 4 5 6 7 8 9
HPFTDigit/Fourth Digit: *0 1 2 3 4 5 6 7 8 9
   `,
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "Collate": Object {
        "defaultValue": "False",
        "key": "Collate",
        "label": "Collate",
        "values": Array [
          "True",
          "False",
        ],
      },
      "Duplex": Object {
        "defaultValue": "None",
        "key": "Duplex",
        "label": "Two-Sided",
        "values": Array [
          "None",
          "DuplexNoTumble",
          "DuplexTumble",
        ],
      },
      "HPFIDigit": Object {
        "defaultValue": "0",
        "key": "HPFIDigit",
        "label": "First Digit",
        "values": Array [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ],
      },
      "HPFTDigit": Object {
        "defaultValue": "0",
        "key": "HPFTDigit",
        "label": "Fourth Digit",
        "values": Array [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ],
      },
      "HPOption_Duplexer": Object {
        "defaultValue": "False",
        "key": "HPOption_Duplexer",
        "label": "Duplex Unit",
        "values": Array [
          "True",
          "False",
        ],
      },
      "HPOption_JobStorage": Object {
        "defaultValue": "False",
        "key": "HPOption_JobStorage",
        "label": "Job Storage",
        "values": Array [
          "False",
          "True",
        ],
      },
      "HPOption_Tray3": Object {
        "defaultValue": "False",
        "key": "HPOption_Tray3",
        "label": "Tray 3",
        "values": Array [
          "False",
          "True",
        ],
      },
      "HPPJLPrintQuality": Object {
        "defaultValue": "Normal",
        "key": "HPPJLPrintQuality",
        "label": "Print Quality",
        "values": Array [
          "Normal",
          "Economode",
        ],
      },
      "HPPinPrnt": Object {
        "defaultValue": "False",
        "key": "HPPinPrnt",
        "label": "Secure Printing",
        "values": Array [
          "True",
          "False",
        ],
      },
      "HPSEDigit": Object {
        "defaultValue": "0",
        "key": "HPSEDigit",
        "label": "Second Digit",
        "values": Array [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ],
      },
      "HPTHDigit": Object {
        "defaultValue": "0",
        "key": "HPTHDigit",
        "label": "Third Digit",
        "values": Array [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ],
      },
      "InputSlot": Object {
        "defaultValue": "Auto",
        "key": "InputSlot",
        "label": "Paper Feed",
        "values": Array [
          "Auto",
          "Tray1",
          "Tray2",
          "Tray3",
          "ManualFeed",
        ],
      },
      "MediaType": Object {
        "defaultValue": "Unspecified",
        "key": "MediaType",
        "label": "Media Type",
        "values": Array [
          "Unspecified",
          "Plain",
          "HPEcoFFICIENT",
          "Light6074",
          "Intermediate8595",
          "MidWeight96110",
          "Heavy111130",
          "ExtraHeavy131175",
          "Labels",
          "Letterhead",
          "Envelope",
          "Preprinted",
          "Prepunched",
          "Colored",
          "Bond",
          "Recycled",
          "Rough",
        ],
      },
      "PageSize": Object {
        "defaultValue": "Letter",
        "key": "PageSize",
        "label": "Media Size",
        "values": Array [
          "Letter",
          "Legal",
          "Executive",
          "Statement",
          "FanFoldGermanLegal",
          "4x6",
          "5x8",
          "A4",
          "A5",
          "A6",
          "B5",
          "B6",
          "102x152mm",
          "Oficio",
          "195x270mm",
          "184x260mm",
          "7.75x10.75",
          "Postcard",
          "DoublePostcardRotated",
          "Env10",
          "EnvMonarch",
          "EnvISOB5",
          "EnvC5",
          "EnvDL",
          "Custom.WIDTHxHEIGHT",
        ],
      },
    }
  `);
});

test('options for default printer', async () => {
  execMock.mockResolvedValueOnce({
    stdout: 'Opt/Option Name: A B',
    stderr: '',
  });

  expect(await getPrinterOptions()).toEqual({
    Opt: {
      key: 'Opt',
      label: 'Option Name',
      values: ['A', 'B'],
    },
  });

  expect(exec).toHaveBeenCalledWith('lpoptions', ['-l']);
});

test('options for named printer', async () => {
  execMock.mockResolvedValueOnce({
    stdout: 'Opt/Option Name: A B',
    stderr: '',
  });

  expect(await getPrinterOptions('VxPrinter')).toEqual({
    Opt: {
      key: 'Opt',
      label: 'Option Name',
      values: ['A', 'B'],
    },
  });

  expect(exec).toHaveBeenCalledWith('lpoptions', ['-p', 'VxPrinter', '-l']);
});
