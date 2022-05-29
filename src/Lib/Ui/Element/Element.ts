import { UiElementPrimitivePadParams as PadParams } from "./Primitive/Pad/Params";
import { UiElementPrimitiveTextParams as TextParams } from "./Primitive/Text/Params";
import { UiElementPrimitiveFixAspectParams as FixAspectParams } from "./Primitive/FixAspect/Params";
import { UiElementPrimitiveTouchableParams as TouchableParams } from "./Primitive/Touchable/Params";
import { UiElementPrimitiveSplitParams as SplitParams } from "./Primitive/Split/Params";
import { UiElementPrimitiveFillParams as FillParams } from "./Primitive/Fill/Params";

export type UiElement<T = any> =
	[(params: T, ...children: UiElement[]) => UiElement, T, ...UiElement[]] |
	['text', TextParams, ...string[]] |
	['fill', FillParams, ...UiElement[]] |
	['split', SplitParams, ...UiElement[]] |
	['split-x', {}, ...UiElement[]] |
	['split-y', {}, ...UiElement[]] |
	['pad', PadParams, ...UiElement[]] |
	['fixed-aspect-ratio', FixAspectParams, ...UiElement[]] |
	['touchable', TouchableParams, ...UiElement[]] |
	number |
	string |
	boolean |
	null;
