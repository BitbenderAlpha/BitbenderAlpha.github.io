import { Ratio } from "@bits.ts/all";
import { UiDimension } from "../../../Dimension";


export interface UiElementPrimitiveFixAspectParams {
	readonly ratio?: Ratio;
	readonly longDimension?: UiDimension;
}
