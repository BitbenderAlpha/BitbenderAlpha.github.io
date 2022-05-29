
// function drawQuizScene(state: State, area: PixelRectangle) {
	
// 	if (!(state.scene instanceof QuizScene)) return;

// 	drawUiElement(
// 		[
// 			'split', {
// 				ratio: Ratio.Clamp(0.1),
// 				primaryChild: [ Header ],
// 				secondaryChild: [
// 					'split', {
// 						ratio: Ratio.Clamp(1 - 1/30),
// 						secondaryChild: [
// 							'fill', {
// 								color: 'black',
// 								child: [
// 									'text', {
// 										text: 'Hacked Together by Bitbender',
// 										color: 'white',
// 									}
// 								],
// 							},
// 						],
// 					}
// 				],
// 			}
// 		],
// 		area,
// 	);

// 	const [bodyArea] =
// 		area.splitVertical(Ratio.From(0.1).orDie())[1].splitVertical(Ratio.From(1-1/30).orDie());
	

// 	// Guarantee Aspect Ratio of Main Section
// 	const mainHeightWidthRatio = 1.5
// 	const mainContentArea =
// 		bodyArea.heightPerWidth < mainHeightWidthRatio
// 			? bodyArea.trimX(Ratio.From(bodyArea.heightPerWidth/mainHeightWidthRatio).orDie())
// 			: bodyArea.splitVertical(Ratio.From(mainHeightWidthRatio/bodyArea.heightPerWidth).orDie())[0]

// 	const [squareArea, controlsArea] =
// 		mainContentArea
// 			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

// 	const grayByte = Math.floor(state.scene.contextLightness.value * 256).toString(16);
// 	const contextColor = '#' + [0,0,0].map(() => grayByte).join('');
// 	drawUiElement(['fill', {color: contextColor }], squareArea);
// 	const paddingRatio = Ratio.Clamp(0.9);
// 	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

// 	drawUiElement(['fill', {color: state.scene.quiz.currentColor }], colorSampleArea);
// 	if ((new URLSearchParams(location.search)).get('debug') === 'true') {
// 		drawText(colorSampleArea.trimY(Ratio.Clamp(.1)), state.scene.quiz.currentColor);
// 	}

// 	const [progressBarArea, buttonsArea] = controlsArea.splitVertical(Ratio.Clamp(0.1));

// 	const progressBar = progressBarArea.trimY(Ratio.Half).splitHorizontal(state.scene.quiz.progress)[0];
// 	drawUiElement(['fill', { color: 'white' }], progressBar);

// 	const [ selectionButtonsArea ] =
// 		buttonsArea.trimX(paddingRatio).trimY(paddingRatio)
// 			.splitVertical(Ratio.Half);

// 	const [unpaddedGreenButtonArea, unpaddedYellowButtonArea] =
// 		selectionButtonsArea.splitHorizontal(Ratio.Half);

// 	const greenButtonArea = unpaddedGreenButtonArea.trimRight(paddingRatio);
// 	const yellowButtonArea = unpaddedYellowButtonArea.trimLeft(paddingRatio);

// 	function registerColorSelection(answeredYellow: boolean) {
// 		return function onClick(state: State): State {
// 			// This line exists for type inference
// 			if (!(state.scene instanceof QuizScene)) return state;
// 			const answerOutput = state.scene.quiz.answer(answeredYellow);
// 			return {
// 				...state, 
// 				scene:
// 				(answerOutput instanceof QuizState)
// 					? state.scene.butQuiz(answerOutput)
// 					: ResultScene.Make({answers: answerOutput})
// 			};
// 		}
// 	}

// 	drawButton(greenButtonArea, 'Green!', registerColorSelection(false));
// 	drawButton(yellowButtonArea, 'Yellow!', registerColorSelection(true));
// }

// function drawResult(state: State, area: PixelRectangle) {
// 	if (!(state.scene instanceof ResultScene)) return;

// 	const [headerArea, nonHeaderArea] = area.splitVertical(Ratio.Clamp(0.1));
// 	drawUiElement([ Header ], headerArea);
// 	const [bodyArea, footerArea] =
// 		nonHeaderArea.splitVertical(Ratio.From(1-1/30).orDie());
// 	drawUiElement(['fill', { color: 'black' }], footerArea);
// 	drawText(footerArea, 'Hacked Together by Bitbender');

// 	// Guarantee Aspect Ratio of Main Section
// 	const mainHeightWidthRatio = 1.5
// 	const mainContentArea =
// 		bodyArea.heightPerWidth < mainHeightWidthRatio
// 			? bodyArea.trimX(Ratio.From(bodyArea.heightPerWidth/mainHeightWidthRatio).orDie())
// 			: bodyArea.splitVertical(Ratio.From(mainHeightWidthRatio/bodyArea.heightPerWidth).orDie())[0]

// 	const [squareArea, controlsArea] =
// 		mainContentArea
// 			.splitVertical(Ratio.From(mainContentArea.widthPerHeight).orDie());

// 	const paddingRatio = Ratio.Clamp(0.9);
// 	const colorSampleArea = squareArea.trimX(paddingRatio).trimY(paddingRatio);

// 	const blockWidth = Math.floor(colorSampleArea.width.value / state.scene.answers.rowCount.value);
// 	const blockHeight = Math.floor(colorSampleArea.height.value / state.scene.answers.columnCount.value);
	
// 	for (const [i, j, [color, answeredYellow]] of state.scene.answers) {
// 		const x = colorSampleArea.x.value + i.value * blockWidth;
// 		const y = colorSampleArea.y.value + Math.floor(j.value * colorSampleArea.height.value / state.scene.answers.columnCount.value);
// 		const area = new PixelRectangle(
// 			NonNegativeInteger.From(x).orDie(),
// 			NonNegativeInteger.From(y).orDie(),
// 			PositiveInteger.From(blockWidth).orDie(),
// 			PositiveInteger.From(blockHeight).orDie(),
// 		);
// 		drawUiElement([
// 			'fill', { color }
// 		], area);
// 		drawText(area, answeredYellow ? 'Y' : 'G', 'black');
// 	}

// 	canvasContext.strokeStyle = 'white';
// 	canvasContext.lineWidth = window.innerWidth / 100;
// 	canvasContext.lineCap = 'butt';
// 	canvasContext.beginPath()
// 	canvasContext.moveTo(window.innerWidth / 2, squareArea.y.value);
// 	canvasContext.lineTo(window.innerWidth / 2, squareArea.y.value + 1.25*squareArea.height.value);
// 	canvasContext.stroke();

// 	const [labelsArea, buttonArea] = controlsArea.splitVertical(Ratio.Clamp(1/6));
// 	const [greenLabel, yellowLabel] = labelsArea.splitHorizontal(Ratio.Half);
// 	drawText(greenLabel, '< Green', 'green');
// 	drawText(yellowLabel, 'Yellow >', 'yellow');

// 	drawButton(
// 		buttonArea.trimX(Ratio.Clamp(0.8)).trimY(Ratio.Clamp(0.6)),
// 		'<<< Restart!',
// 		state => ({ ...state, scene: TitleScene.Make() })
// 	);
// }