import '@/styles/globals.css'

//@ts-ignore
import { ThemeProvider, theme } from '@/components/provider/theme-provider'
import { Decorator, Preview } from '@storybook/react'
import { ReactNode } from 'react'

const ThemeBlock = ({
  children,
  left,
  fill,
  theme,
}: {
  children: ReactNode
  left?: boolean
  fill?: boolean
  theme: 'light' | 'dark'
}) => {
  return (
    <ThemeProvider forcedTheme={theme} attribute={'class'}>
      {fill ? (
        <div>{children}</div>
      ) : (
        <div
          style={
            {
              // position: 'absolute',
              // top: 0,
              // left: `${left ? 0 : '50vw'}`,
              // borderRight: `${left ? '1px solid #ccc' : 'none'}`,
              // right: `${left ? '50vw' : 0}`,
              // width: `50vw`,
              // height: '100vh',
              // bottom: 0,
              // overflow: 'auto',
              // padding: '1rem',
              // display: 'flex',
              // flexWrap: 'wrap',
              // maxWidth: '100%'
              // background: ${color.screenBackground};
              // ${breakpoints.S} {
              // left: ${left ? 0 : '50vw'};
              // right: ${left ? '50vw' : 0};
              // padding: 0 !important;
            }
          }
        >
          {/*  styled.div<{ left?: boolean; fill?: boolean }>(*/}
          {/*  ({ left, fill, theme: { color } }) =>*/}
          {/*  css`*/}
          {/*  // position: absolute;*/}
          {/*  // top: 0;*/}
          {/*  // left: ${left || fill ? 0 : '50vw'};*/}
          {/*  // border-right: ${left ? '1px solid #202020' : 'none'};*/}
          {/*  // right: ${left ? '50vw' : 0};*/}
          {/*  // width: ${fill ? '100vw' : '50vw'};*/}
          {/*  // height: 100vh;*/}
          {/*  // bottom: 0;*/}
          {/*  // overflow: auto;*/}
          {/*  // padding: 1rem;*/}
          {/*  // background: ${color.screenBackground};*/}
          {/*  // ${breakpoints.S} {*/}
          {/*  // left: ${left ? 0 : '50vw'};*/}
          {/*  // right: ${left ? '50vw' : 0};*/}
          {/*  // padding: 0 !important;*/}
          {/*}*/}
          {/*  `*/}
          {/*  )*/}
          {/*<div>*/}
          {children}
          {/*</div>*/}
        </div>
      )}
    </ThemeProvider>
  )
}

export const withTheme: Decorator = (StoryFn, context) => {
  // Get values from story parameter first, else fallback to globals
  const theme = context.parameters.theme || context.globals.theme
  // const storyTheme = theme === 'light' ? lightTheme : darkTheme

  switch (theme) {
    case 'side-by-side': {
      return (
        <>
          <ThemeBlock left theme={'light'}>
            <div className="light">
              <StoryFn />
            </div>
          </ThemeBlock>

          <ThemeBlock theme={'dark'}>
            <div className="dark">
              <StoryFn />
            </div>
          </ThemeBlock>
        </>
      )
    }
    default: {
      return (
        <ThemeBlock fill theme={theme}>
          <StoryFn />
        </ThemeBlock>
      )
    }
  }
}

const decorators = [withTheme]

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'dark',
    toolbar: {
      title: 'Theme',
      // The icon for the toolbar item
      icon: 'sun',
      // Array of options
      items: [
        { value: 'dark', icon: 'moon', title: 'dark' },
        { value: 'light', icon: 'sun', title: 'light' },
        { value: 'side-by-side', icon: 'sidebar', title: 'side by side' },
      ],
      // Change title based on selected value
      dynamicTitle: true,
      // Property that specifies if the name of the item will be displayed
      showName: true,
    },
  },
}

export const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Documentation', 'Atoms', 'Molecules', 'Organisms', 'Pages'],
      },
    },
  },
  decorators,
}

export default preview
