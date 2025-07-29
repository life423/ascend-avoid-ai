Modern web standards have introduced techniques that make canvas‑based interfaces responsive without writing dozens of media query breakpoints.  Here are the most useful patterns as of July 2025:

Use CSS rather than JavaScript where possible

Technique	How it works	Why it reduces media‑query boilerplate
Container queries	Media queries target the entire viewport; container queries target the dimensions of the element’s parent.  MDN notes that container queries are an alternative to media queries and apply styles “based on the container’s dimensions” ￼.  You activate them by giving a parent a container-type of size or inline-size and then using the @container rule inside the child.	Components such as your canvas container automatically adjust to whatever space they are given.  If a sidebar shrinks, the canvas can switch layout or scale drawings without caring about the overall screen size.
CSS math functions	The calc(), clamp(), min() and max() functions enable fluid sizing without explicit breakpoints.  For example, using height: calc(100vh – 60px) lets a panel take up the remaining viewport height, and the result updates automatically as the viewport changes ￼.  The clamp() function sets a minimum, ideal and maximum value so a property grows fluidly within a range; it’s commonly used for fluid typography (e.g., font-size: clamp(1.75rem, 4vw + 1rem, 3rem)) ￼.  Likewise, min() chooses the smaller of two values (e.g., width: min(80ch, 100vw)), so on wide screens the width is capped but on narrow screens it fills the viewport ￼.	These functions produce smooth scaling for widths, heights and margins without the need for multiple breakpoints.  You can express the canvas container size as a formula (e.g., width: min(600px, 80%)) so it adapts across device sizes.
aspect‑ratio property	Setting aspect-ratio on the canvas container (e.g., aspect-ratio: 16/9) tells the browser to maintain a specific width‑to‑height ratio even as its parent or the viewport size changes.  MDN explains that aspect-ratio lets the browser adjust an element’s dimensions “to maintain the specified width‑to‑height ratio” whenever the container or viewport changes ￼.	When paired with width: 100%, the canvas automatically scales with the parent while keeping its proportions; the height is calculated for you, so no breakpoint is needed to preserve aspect ratio.
Modern viewport units	On mobile devices the browser chrome can cause 100vh to jump when the address bar appears/disappears.  New units (svh, lvh and dvh) represent the small, large and dynamic viewport heights.  An article on DEV shows that using svh for heights (e.g., height: 100svh) produces a consistent result because it ignores the browser UI ￼.	Replacing vh with svh or lvh avoids layout jumps and reduces the need for custom breakpoints to handle mobile browser UI changes.

Handle canvas resolution programmatically
	•	Scale drawing for high‑DPI screens.  On high‑DPI devices, canvases drawn at 1:1 CSS pixels appear blurry.  The Web.dev canvas guide suggests measuring the canvas in CSS pixels (getBoundingClientRect()), multiplying by window.devicePixelRatio, and setting the canvas’s width and height attributes accordingly; then call ctx.scale(dpr, dpr) so drawing commands stay the same ￼.  This keeps the canvas crisp when you resize it.
	•	Watch for size changes using ResizeObserver or window.resize.  Media queries are static; JavaScript observers let you resize the canvas whenever its container changes.  For example, observe the container’s size, set the canvas’s CSS width/height to 100%, update its internal width/height attributes to match the container, and re‑draw.  This technique pairs well with container queries: the CSS decides when the container layout changes; the observer updates the canvas resolution and avoids manual breakpoints.
	•	Consider canvas libraries that abstract away scaling.  Libraries like VBCanvas treat the canvas like an SVG by adding a viewBox; the canvas is drawn in a logical coordinate space (e.g., 0 0 100 100) and scaled to fit its container.  This approach, described in a DEV article, allows the canvas to “automatically scale / respond exactly like an <svg> element” ￼—you specify a scale mode (contain or cover), and the library handles resizing and redrawing.

Putting it together

A modern responsive canvas container might look like this:

<div class="canvas-wrapper">
  <canvas id="chart"></canvas>
</div>

/* create a container query context */
.canvas-wrapper {
  width: min(600px, 80%);    /* fluid width with max cap */
  aspect-ratio: 16/9;        /* maintain 16:9 ratio */
  container-type: inline-size;
}

/* adjust canvas drawing based on container width */
@container (width > 500px) {
  /* optional: change controls or layout when wrapper grows */
}

const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    const {width, height} = entry.contentRect;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    drawChart(); // your drawing code here
  }
});
resizeObserver.observe(document.querySelector('.canvas-wrapper'));

This pattern uses container queries for CSS‑controlled layout, CSS math functions for fluid sizing, aspect-ratio for proportional scaling, modern viewport units for mobile browsers, and a ResizeObserver with device‑pixel scaling to keep the canvas crisp.  It eliminates most manual media queries and keeps your canvas responsive and sharp across devices.