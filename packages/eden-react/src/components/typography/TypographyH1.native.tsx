import type { PropsWithChildren } from 'react'
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native'

type NativeHeadingProps = PropsWithChildren<
  TextProps & {
    style?: StyleProp<TextStyle>
  }
>

const styles = StyleSheet.create({
  base: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
})

export const TypographyH1 = ({
  style,
  children,
  ...rest
}: NativeHeadingProps) => {
  return (
    <Text style={[styles.base, style]} {...rest}>
      {children}
    </Text>
  )
}
