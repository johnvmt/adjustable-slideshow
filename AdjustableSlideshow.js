class AdjustableSlideshow extends HTMLElement {
	constructor() {
		super();

		const thisElem = this;

		thisElem.ready = false;

		const shadow = thisElem.attachShadow({mode: 'open'});
		shadow.innerHTML = `<style>
			:host {
				display: block;
				height: 100%;
				width: 100%;
				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
			}
			</style>
			
			<div id="container" style="width: 100%; height: 100%; overflow: hidden">
				<slot></slot>
			</div>`;

		thisElem.elements = {
			container: shadow.querySelector('slot')
		};

		thisElem.elementModeListeners = {
			single: function(event) {
				let element = event.detail.element;
				let elementIndex = event.detail.elementIndex;
				let elements = event.detail.elements;
				let step = event.detail.step;

				element.style.zIndex = String(elements.length - elementIndex); // Set z-index = (length - elementIndex); first element is top

				// if stack = false: only show active
				// if stack = true: show elements under active element; hide where elementIndex < activeIndex
				// if activeIndex = null : hide all
				if(elementIndex === step) { // Activate
					if(typeof element.getAttribute('data-slideshow-class-active') === 'string')
						AdjustableSlideshow.addClass(element, element.getAttribute('data-slideshow-class-active'));
					if(typeof element.getAttribute('data-slideshow-class-inactive') === 'string')
						AdjustableSlideshow.removeClass(element, element.getAttribute('data-slideshow-class-inactive'));
				}
				else { // Deactivate
					if(typeof element.getAttribute('data-slideshow-class-active') === 'string')
						AdjustableSlideshow.removeClass(element, element.getAttribute('data-slideshow-class-active'));
					if(typeof element.getAttribute('data-slideshow-class-inactive') === 'string')
						AdjustableSlideshow.addClass(element, element.getAttribute('data-slideshow-class-inactive'));
				}
			},
			stack: function(event) {
				let element = event.detail.element;
				let elementIndex = event.detail.elementIndex;
				let elements = event.detail.elements;
				let step = event.detail.step;

				element.style.zIndex = String(elements.length - elementIndex); // Set z-index = (length - elementIndex); first element is top

				// if stack = true: show elements under active element; hide where elementIndex < activeIndex
				// if activeIndex = null : hide all
				if(elementIndex !== null && elementIndex >= step) {
					if(typeof element.getAttribute('data-slideshow-class-active') === 'string')
						AdjustableSlideshow.addClass(element, element.getAttribute('data-slideshow-class-active'));
					if(typeof element.getAttribute('data-slideshow-class-inactive') === 'string')
						AdjustableSlideshow.removeClass(element, element.getAttribute('data-slideshow-class-inactive'));
				}
				else {
					if(typeof element.getAttribute('data-slideshow-class-active') === 'string')
						AdjustableSlideshow.removeClass(element, element.getAttribute('data-slideshow-class-active'));
					if(typeof element.getAttribute('data-slideshow-class-inactive') === 'string')
						AdjustableSlideshow.addClass(element, element.getAttribute('data-slideshow-class-inactive'));
				}
			}
		};

		thisElem.elements.container.addEventListener('slotchange', function() {
			thisElem.runStep(thisElem.step, thisElem.mode);
		});

		thisElem.addModeListener();

		// Defer until attributes set so runstep does not execute multiple times
		setTimeout(function() {
			thisElem.ready = true;
			thisElem.runStep(thisElem.step, thisElem.mode);
		}, 0);
	}

	get step() {
		let stringValue = this.getAttribute('step');
		return (stringValue === null) ? null : Number(stringValue);
	}

	set step(passedValue) {
		let setValue = (passedValue === null || typeof passedValue === 'undefined') ? null : Number(passedValue);

		if(setValue === null)
			this.removeAttribute('step');
		else
			this.setAttribute('step', setValue);

		this.runStep(this.step, this.mode);
	}

	get mode() {
		let stringValue = this.getAttribute('mode');
		return (stringValue === null) ? 'single' : stringValue.toLowerCase();
	}

	set mode(passedValue) {
		let setValue = (passedValue === null || typeof passedValue !== 'string') ? 'single' : passedValue;

		if(setValue === null)
			this.removeAttribute('mode');
		else if(this.getAttribute('mode') !== passedValue)
			this.setAttribute('mode', setValue);

		this.addModeListener();

		this.runStep(this.step, this.mode);
	}

	addModeListener() {
		const mode = this.mode;

		// For internal modes
		if(typeof this._activeElementModeListener === 'function')
			this.removeEventListener('element', this._activeElementModeListener);

		if(typeof mode === 'string' && typeof this.elementModeListeners[mode] === 'function') {
			this.addEventListener('element', this.elementModeListeners[mode]);
			this._activeElementModeListener = this.elementModeListeners[mode];
		}
	}

	runStep(step, mode, mirrorTag) {
		const thisElem = this;

		// For mirroring
		if(mode !== this.mode)
			this.mode = mode;

		if(thisElem.ready && (thisElem._currentStep !== step || thisElem._currentMode !== mode)) {
			thisElem._currentStep = step;
			thisElem._currentMode = mode;
			thisElem.emitMirror(mirrorTag, 'runStep', [step, mode]); // Emit mirror event

			let stepEvent = new CustomEvent('step', {detail: step}); // Emit step event
			thisElem.dispatchEvent(stepEvent);

			const slotElements = thisElem.slotElements(); // Get filtered elements in slot

			slotElements.forEach(function(element, elementIndex) {
				let eventDetail = {
					step: step,
					mode: mode,
					element: element,
					elementIndex: elementIndex,
					elements: slotElements
				};
				let elementEvent = new CustomEvent('element', {detail: eventDetail}); // Emit step event
				thisElem.dispatchEvent(elementEvent);
			});

			if(thisElem.step !== step)
				thisElem.step = step;
		}
	};

	slotElements(slot) {
		if(typeof slot === 'undefined')
			slot = this.elements.container;

		let elements = slot.assignedNodes().filter(function(element) {
			return ['#text', 'DOM-REPEAT'].indexOf(element.nodeName) < 0; // Exclude whitespace at beginning and end
		});

		if(elements.length === 1 && elements[0].nodeName === 'SLOT')
			return this.slotElements(elements[0]);
		else
			return elements;
	}

	emitMirror(mirrorTag, functionName, functionArgs) {
		if(!Array.isArray(functionArgs))
			functionArgs = [];

		let emitMirrorDetail = {function: functionName, arguments: functionArgs};
		if(typeof mirrorTag !== 'undefined')
			emitMirrorDetail.tag = mirrorTag;

		let mirrorEvent = new CustomEvent('mirror', {detail: emitMirrorDetail});
		this.dispatchEvent(mirrorEvent);

	};

	static get observedAttributes() {
		return ['step', 'mode'];
	}

	attributeChangedCallback(attribute, oldVal, newVal) {
		if(['step', 'mode'].indexOf(attribute) >= 0 && oldVal !== newVal)
			this[attribute] = newVal;
	};

	static hasClass(el, className) {
		if(el.classList)
			return el.classList.contains(className);
		else
			return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
	}

	static addClass(el, className) {
		if(el.classList)
			el.classList.add(className);
		else if(!this.hasClass(el, className)) el.className += " " + className
	}

	static removeClass(el, className) {
		if(el.classList)
			el.classList.remove(className);
		else if(this.hasClass(el, className)) {
			let reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
			el.className=el.className.replace(reg, ' ')
		}
	}
}

customElements.define('adjustable-slideshow', AdjustableSlideshow);

export default AdjustableSlideshow;
