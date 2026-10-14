import { DisplayMediaRequestHandlerHandlerRequest, Session } from 'electron';
import allowSelfCapture from './display-media';

type SetDisplayMediaRequestHandler = Session['setDisplayMediaRequestHandler'];

function registeredHandler(): Parameters<SetDisplayMediaRequestHandler>[0] {
  const setDisplayMediaRequestHandler = jest.fn<
    ReturnType<SetDisplayMediaRequestHandler>,
    Parameters<SetDisplayMediaRequestHandler>
  >();
  allowSelfCapture({
    setDisplayMediaRequestHandler,
  } as unknown as Session);
  return setDisplayMediaRequestHandler.mock.calls[0][0];
}

test('grants the requesting frame as the video source', () => {
  const frame = {};
  const callback = jest.fn();

  registeredHandler()?.(
    { frame } as unknown as DisplayMediaRequestHandlerHandlerRequest,
    callback,
  );

  expect(callback).toHaveBeenCalledWith({ video: frame });
});

test('denies requests without a frame', () => {
  const callback = jest.fn();

  registeredHandler()?.(
    { frame: null } as unknown as DisplayMediaRequestHandlerHandlerRequest,
    callback,
  );

  expect(callback).toHaveBeenCalledWith({});
});
