/**
 * Handlers that start downloading a page's code the moment the user shows
 * intent to open it — hovering a link with the mouse, focusing it with the
 * keyboard, or the first touch of a tap (~100-300ms before the tap
 * completes). By the time the navigation happens the chunk is usually
 * already there, so the page appears without the loading bar.
 *
 * Spread onto any link: <NavLink {...preloadOnIntent(() => Page.preload())} />
 */
export function preloadOnIntent(preload) {
    let started = false;
    const start = () => {
        if (started) return;
        started = true;
        Promise.resolve()
            .then(preload)
            .catch(() => { started = false; }); // offline? try again next time
    };
    return { onPointerEnter: start, onFocus: start, onTouchStart: start };
}
