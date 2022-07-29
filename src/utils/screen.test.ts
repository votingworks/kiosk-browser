import execSync from './execSync';
import mockOf from '../../test/mockOf';
import { getMainScreen } from './screen';

jest.mock('./execSync', () => jest.fn());

const execSyncMock = mockOf(execSync);

test('`getMainScreen` gets screen information for the first connected screen', () => {
  execSyncMock.mockReturnValue({
    stdout: `Screen 0: minimum 0 x 0, current 1314 x 760, maximum 8196 x 8196
Virtual1 disconnected
Virtual2 connected primary 1314x760+0+0 0mm x 0mm
    1024x768      59.95 +
    1314x760      59.93* 
    800x600       59.96  
    640x480       59.94  
Virtual3 disconnected
Virtual4 disconnected
Virtual5 disconnected
Virtual6 disconnected`,
    stderr: '',
  });

  expect(getMainScreen()).toMatchInlineSnapshot(`
    Object {
      "connected": true,
      "height": 760,
      "index": 1,
      "modes": Array [
        Object {
          "height": "768",
          "rate": 59.95,
          "width": "1024",
        },
        Object {
          "height": "760",
          "rate": 59.93,
          "width": "1314",
        },
        Object {
          "height": "600",
          "rate": 59.96,
          "width": "800",
        },
        Object {
          "height": "480",
          "rate": 59.94,
          "width": "640",
        },
      ],
      "width": 1314,
    }
  `);
});

test('`getMainScreen` returns nothing if there are no connected screens', () => {
  execSyncMock.mockReturnValue({
    stdout: '',
    stderr: '',
  });

  expect(getMainScreen()).toBeUndefined();
});
