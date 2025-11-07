import { Dimensions, Platform } from "react-native";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";

const { width, height } = Dimensions.get("window");

export const widthSize = width;
export const heightSize = height;

export const wp = (p: number) => widthPercentageToDP(p);
export const hp = (p: number) => heightPercentageToDP(p);

export const isIos = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
