import { Session } from 'electron';

/**
 * Lets the top-level page record itself with `navigator.mediaDevices.getDisplayMedia`.
 */
export default function allowSelfCapture(session: Session): void {
  session.setDisplayMediaRequestHandler((request, callback) => {
    const { frame } = request;
    callback(frame && !frame.parent ? { video: frame } : {});
  });
}
