import { CssVarsProvider, extendTheme } from '@mui/joy/styles'
import type { FC } from 'react'

const theme = extendTheme({
  fontFamily: {
    body: 'inherit',
  },
})

export interface JoyUiProvider {
  children?: React.ReactNode
}
export const JoyUiProvider: FC<JoyUiProvider> = (props) => {
  return <CssVarsProvider theme={theme}>{props.children}</CssVarsProvider>
}
