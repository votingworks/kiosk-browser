import { Session } from 'electron';

/**
 * Lets the page record itself with `navigator.mediaDevices.getDisplayMedia`.
 */
export default function allowSelfCapture(session: Session): void {
  session.setDisplayMediaRequestHandler((request, callback) => {
    callback(request.frame ? { video: request.frame } : {});
  });
}
