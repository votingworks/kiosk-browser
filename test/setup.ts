import { usbResource } from '../src/utils/usb'

afterEach(() => {
  usbResource.releaseAll()
})
