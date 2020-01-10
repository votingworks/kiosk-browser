declare module 'xrandr-parse' {
  export interface Screens {
    [key: string]: Screen
  }

  export interface Screen {
    connected: boolean
    width?: number
    height?: number
    modes: Mode[]
    index: number
    native?: Mode
    current?: Mode
  }

  export interface Mode {
    width: string
    height: string
    rate: number
  }

  export default function parse(output: string): Screens
}
