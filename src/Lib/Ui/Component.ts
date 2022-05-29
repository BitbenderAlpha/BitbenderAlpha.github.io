import { UiElement } from "./Element/Element";

export interface UiComponent<T> {
	(params: T, ...children: UiElement[]): UiElement;
}
