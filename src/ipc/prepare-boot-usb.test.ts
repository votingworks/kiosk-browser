import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel } from './prepare-boot-usb';

const execMock = mockOf(exec);

jest.mock('../utils/exec');

beforeEach(() => {
  execMock.mockClear();
});

test('prepare-boot-usb returns false when no bootable usbs', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  // Things should be registered as expected.
  execMock.mockReturnValueOnce({
    stdout: `BootCurrent: 0005
Timeout: 0 seconds
BootOrder: 0005,0002,0001,0003,0000,0004
Boot0000* UiApp	FvVol(45801e53-5502-4463-929a-9bafaf424a72)/FvFile(462caa21-7614-4503-836e-8ab6f4662331)
Boot0001* UEFI Virtual DVD-ROM 	VenHw(0d51905b-b77e-452a-a2c0-eca0cc8d514a,000014020000000000)/Sata(1,65535,0)N.....YM....R,Y.
Boot0002* UEFI My Amazing VM-0 SSD VV1P025T47V454YQW0DW	VenHw(0d51905b-b77e-452a-a2c0-eca0cc8d514a,000014020000000000)/Sata(0,65535,0)N.....YM....R,Y.
Boot0003* No OS found	FvVol(45801e53-5502-4463-929a-9bafaf424a72)/FvFile(343e8cc7-cbc7-4d2f-af94-e783b827053b)
Boot0004* UEFI Shell	FvVol(45801e53-5502-4463-929a-9bafaf424a72)/FvFile(7c04a583-9e3e-4f1c-ad65-e05268d0b4d1)
Boot0005* debian	HD(1,GPT,7dd453ac-2e62-44f6-be51-5f6bcaa85a61,0x800,0x100000)/File(\\EFI\\debian\\shimaa64.efi)
    `,
    stderr: '',
  });

  // Is the handler wired up right?
  const result = (await ipcRenderer.invoke(channel)) as boolean;
  expect(result).toBe(false);

  expect(execMock).toBeCalledTimes(1);
  expect(execMock).toHaveBeenNthCalledWith(1, 'efibootmgr', ['-v']);
});

test('prepare-boot-usb returns true when expected and sets correct boot order', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  // Things should be registered as expected.
  execMock.mockReturnValueOnce({
    stdout: `BootCurrent: 0000
Timeout: 0 seconds
BootOrder: 0000
Boot0000* ubuntu 	HD(1,GPT,7dd453ac-2e62-44f6-be51-5f6bcaa85a61,0x800,0x100000)/File(somefile.efi)
Boot0001* Linpus Lite   	HD(1,MDR,0x314d08f,0x800,0x100000)/File(\\EFI\\boot\\grubx64.efi)RC
Boot2001* EFI USB Device	RC
Boot2002* EFI DVD/CDROM	RC
Boot2003* EFI Network	RC
       `,
    stderr: '',
  });
  execMock.mockReturnValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  const result = (await ipcRenderer.invoke(channel)) as boolean;
  expect(result).toBe(true);
  expect(execMock).toBeCalledTimes(2);
  expect(execMock).toHaveBeenNthCalledWith(1, 'efibootmgr', ['-v']);
  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    '-n',
    '/bin/efibootmgr',
    '-n',
    '0001',
  ]);
});

test('prepare-boot-usb returns true with a USB HDD entry that has a GPT partition and a long UUID', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  // Things should be registered as expected.
  execMock.mockReturnValueOnce({
    stdout: `BootCurrent: 0000
Timeout: 0 seconds
BootOrder: 0000
Boot0000* USB HDD 	HD(1,GPT,7dd453ac-2e62-44f6-be51-5f6bcaa85a61,0x800,0x100000)/File(somefile.efi)
Boot2001* EFI USB Device	RC
Boot2002* EFI DVD/CDROM	RC
Boot2003* EFI Network	RC
       `,
    stderr: '',
  });
  execMock.mockReturnValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  const result = (await ipcRenderer.invoke(channel)) as boolean;
  expect(result).toBe(true);
  expect(execMock).toBeCalledTimes(2);
  expect(execMock).toHaveBeenNthCalledWith(1, 'efibootmgr', ['-v']);
  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    '-n',
    '/bin/efibootmgr',
    '-n',
    '0000',
  ]);
});

test('prepare-boot-usb returns true when there is a fallback Boot Menu option', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  // Things should be registered as expected.
  execMock.mockReturnValueOnce({
    stdout: `BootCurrent: 0000
Timeout: 0 seconds
BootOrder: 0000
Boot0000* ubuntu	HD(1,GPT,7dd453ac-2e62-44f6-be51-5f6bcaa85a61,0x800,0x100000)/File(somefile.efi)
Boot2001* EFI USB Device	RC
Boot2002* EFI DVD/CDROM	RC
Boot2003* EFI Network	RC
Boot200E  Boot Menu	RC
       `,
    stderr: '',
  });
  execMock.mockReturnValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  const result = (await ipcRenderer.invoke(channel)) as boolean;
  expect(result).toBe(true);
  expect(execMock).toBeCalledTimes(2);
  expect(execMock).toHaveBeenNthCalledWith(1, 'efibootmgr', ['-v']);
  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    '-n',
    '/bin/efibootmgr',
    '-n',
    '200E',
  ]);
});
