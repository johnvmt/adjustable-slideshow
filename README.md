# Adjustable Slideshow #

Web component to create element switchers, with options forcallbacks, styles and transitions

## Example ##

    <link rel="import" href="bower_components/adjustable-slideshow/adjustable-slideshow.html">

    <div style="width: 720px; height: 480px; border: 2px solid #ff0000; position: relative; overflow: hidden;">
        <adjustable-slideshow id="slideshow1" mode="single" style="position: absolute; top: 0; left: 0; z-index: 0; width: 100%; height: 100%;" step="0">
            <div>0</div>
            <div>1</div>
            <div>2</div>
            <div>3</div>
        </adjustable-slideshow>
    </div>

    <script>
        const slideshow = document.querySelector('#slideshow1');
        
        // Adds click-to-advance
        slideshow.addEventListener('click', function() {
            let step = parseInt(this.getAttribute('step'));
            let maxStep = this.childElementCount - 1;
            let nextStep = (step + 1) > maxStep ? 0 : step + 1;
            slideshow.setAttribute('step', String(nextStep));
        });
        
        // Triggered for each step
        slideshow.addEventListener('step', function(event) {
            console.log("Advanced to step", event.detail);
            // Can run a transition here or something
        });
        
        // Triggered on each element in each step
        slideshow.addEventListener('element', function(event) {
            let stepElementDetail = event.detail;
            let element = stepElementDetail.element;
            if(stepElementDetail.step === stepElementDetail.elementIndex) {
                addClass(element, 'slideshowActiveSlide');
                removeClass(element, 'slideshowInactiveSlide');
                // maybe set a z-index here?
                
                // This is the active element
                // Maybe it's a video
                // Maybe the video should play when it becomes active
            }
            else {
                addClass(element, 'slideshowInactiveSlide');
                removeClass(element, 'slideshowActiveSlide');
                // maybe set a z-index here?
                
                // This is an inactive element
                // Maybe it's a video
                // Maybe the video should pause when it becomes inactive
            }
        });
        
        function hasClass(el, className) {
            if(el.classList)
                return el.classList.contains(className);
            else
                return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
        }

        function addClass(el, className) {
            if(el.classList)
                el.classList.add(className);
            else if(!this.hasClass(el, className)) el.className += " " + className
        }

        function removeClass(el, className) {
            if(el.classList)
                el.classList.remove(className);
            else if(this.hasClass(el, className)) {
                let reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                el.className=el.className.replace(reg, ' ')
            }
        }
    </script>