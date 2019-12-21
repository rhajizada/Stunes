
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = key && { [key]: value };
            const child_ctx = assign(assign({}, info.ctx), info.resolved);
            const block = type && (info.current = type)(child_ctx);
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                flush();
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
        }
        if (is_promise(promise)) {
            promise.then(value => {
                update(info.then, 1, info.value, value);
            }, error => {
                update(info.catch, 2, info.error, error);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = { [info.value]: promise };
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/LoginCard.svelte generated by Svelte v3.6.7 */

    const file = "src/LoginCard.svelte";

    function create_fragment(ctx) {
    	var div2, div0, t1, div1, h5, t3, p, t5, a, t6;

    	return {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Get ready to transfer your Spotify playlists to CSV files";
    			t1 = space();
    			div1 = element("div");
    			h5 = element("h5");
    			h5.textContent = "First login";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Login with your Spotify Account";
    			t5 = space();
    			a = element("a");
    			t6 = text("Login");
    			attr(div0, "class", "card-header");
    			add_location(div0, file, 17, 2, 269);
    			attr(h5, "class", "card-title");
    			add_location(h5, file, 21, 4, 396);
    			attr(p, "class", "card-text");
    			add_location(p, file, 22, 4, 440);
    			attr(a, "href", loginPage);
    			attr(a, "class", "btn btn-primary");
    			add_location(a, file, 23, 4, 501);
    			attr(div1, "class", "card-body");
    			add_location(div1, file, 20, 2, 368);
    			attr(div2, "class", "card center bg-secondary svelte-15v4z7f");
    			add_location(div2, file, 16, 0, 228);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div1, h5);
    			append(div1, t3);
    			append(div1, p);
    			append(div1, t5);
    			append(div1, a);
    			append(a, t6);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    			}
    		}
    	};
    }

    let loginPage = '/login';

    class LoginCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/PlaylistCard.svelte generated by Svelte v3.6.7 */

    const file$1 = "src/PlaylistCard.svelte";

    function create_fragment$1(ctx) {
    	var div1, img, img_src_value, img_alt_value, t0, div0, h5, t1_value = ctx.playlist.meta.name, t1, t2, p, t3_value = ctx.playlist.meta.tracks.total, t3, t4, t5, button0, i0, t6, t7, button1, i1, t8, dispose;

    	return {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h5 = element("h5");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = text(" tracks");
    			t5 = space();
    			button0 = element("button");
    			i0 = element("i");
    			t6 = text(" CSV");
    			t7 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t8 = text(" JSON");
    			attr(img, "src", img_src_value = ctx.playlist.meta.images[0].url);
    			attr(img, "class", "card-img-top svelte-10500pv");
    			attr(img, "alt", img_alt_value = ctx.playlist.meta.images[0].url);
    			add_location(img, file$1, 90, 4, 2219);
    			attr(h5, "class", "card-title svelte-10500pv");
    			add_location(h5, file$1, 92, 6, 2348);
    			attr(p, "class", "card-text svelte-10500pv");
    			add_location(p, file$1, 93, 6, 2403);
    			attr(i0, "class", "fa fa-arrow-down");
    			attr(i0, "aria-hidden", "true");
    			add_location(i0, file$1, 94, 75, 2539);
    			attr(button0, "type", "button");
    			attr(button0, "class", "btn btn-success");
    			add_location(button0, file$1, 94, 6, 2470);
    			attr(i1, "class", "fa fa-arrow-down");
    			attr(i1, "aria-hidden", "true");
    			add_location(i1, file$1, 95, 76, 2680);
    			attr(button1, "type", "button");
    			attr(button1, "class", "btn btn-success");
    			add_location(button1, file$1, 95, 6, 2610);
    			attr(div0, "class", "card-body svelte-10500pv");
    			add_location(div0, file$1, 91, 4, 2318);
    			attr(div1, "class", "card svelte-10500pv");
    			add_location(div1, file$1, 89, 0, 2196);

    			dispose = [
    				listen(button0, "click", ctx.downloadCSV),
    				listen(button1, "click", ctx.downloadJSON)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, img);
    			append(div1, t0);
    			append(div1, div0);
    			append(div0, h5);
    			append(h5, t1);
    			append(div0, t2);
    			append(div0, p);
    			append(p, t3);
    			append(p, t4);
    			append(div0, t5);
    			append(div0, button0);
    			append(button0, i0);
    			append(button0, t6);
    			append(div0, t7);
    			append(div0, button1);
    			append(button1, i1);
    			append(button1, t8);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.playlist) && img_src_value !== (img_src_value = ctx.playlist.meta.images[0].url)) {
    				attr(img, "src", img_src_value);
    			}

    			if ((changed.playlist) && img_alt_value !== (img_alt_value = ctx.playlist.meta.images[0].url)) {
    				attr(img, "alt", img_alt_value);
    			}

    			if ((changed.playlist) && t1_value !== (t1_value = ctx.playlist.meta.name)) {
    				set_data(t1, t1_value);
    			}

    			if ((changed.playlist) && t3_value !== (t3_value = ctx.playlist.meta.tracks.total)) {
    				set_data(t3, t3_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { playlist } = $$props;
    const saveCSV = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (csv, filename) {
            let blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
            let url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());

    const saveJSON = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (json, filename) {
            let blob = new Blob([json], {type: "application/json"});
            let url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());

    const downloadCSV = () => {
        saveCSV(toCSV(), `${playlist.meta.name}.csv`);
    };

    const downloadJSON = () => {
        saveJSON(toJSON(), `${playlist.meta.name}.json`);
    };

    const toCSV = () => {
        let csv = 'Title; Artist; Album\n';
        for(let track of playlist.tracklist){
            let title = track.track.name;
            let album = track.track.album.name;
            let artistArray = [];
            for(let artist of track.track.artists){
                artistArray.push(artist.name);
            }
            let artist = artistArray.join(', ');
            csv += `${title}; ${artist}; ${album}\n`;
        }
        return csv;
    };

    const toJSON = () => {
        let object = {
            playlist_name: playlist.meta.name,
            playlist_image: playlist.meta.image,
            songs: []
        };
        for(let track of playlist.tracklist){
            let artistArray = [];
            for(let artist of track.track.artists){
                artistArray.push(artist.name);
            }
            object.songs.push({
                title: track.track.name,
                album: track.track.album.name,
                artists: artistArray
            });
        }
        return JSON.stringify(object);
    };

    	const writable_props = ['playlist'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<PlaylistCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('playlist' in $$props) $$invalidate('playlist', playlist = $$props.playlist);
    	};

    	return { playlist, downloadCSV, downloadJSON };
    }

    class PlaylistCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, ["playlist"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.playlist === undefined && !('playlist' in props)) {
    			console.warn("<PlaylistCard> was created without expected prop 'playlist'");
    		}
    	}

    	get playlist() {
    		throw new Error("<PlaylistCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set playlist(value) {
    		throw new Error("<PlaylistCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Spinner.svelte generated by Svelte v3.6.7 */

    const file$2 = "src/Spinner.svelte";

    function create_fragment$2(ctx) {
    	var div1, h2, t_1, div0, span;

    	return {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Bare with us. We are fetching you playlists.";
    			t_1 = space();
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			attr(h2, "class", "center-text svelte-15qo6is");
    			add_location(h2, file$2, 18, 0, 230);
    			attr(span, "class", "sr-only ");
    			add_location(span, file$2, 20, 2, 369);
    			attr(div0, "class", "spinner-border text-success center svelte-15qo6is");
    			attr(div0, "role", "status");
    			add_location(div0, file$2, 19, 0, 304);
    			attr(div1, "class", "d-flex justify-content-center svelte-15qo6is");
    			add_location(div1, file$2, 17, 0, 186);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, h2);
    			append(div1, t_1);
    			append(div1, div0);
    			append(div0, span);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}
    		}
    	};
    }

    class Spinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src/PlaylistDeck.svelte generated by Svelte v3.6.7 */
    const { Error: Error_1 } = globals;

    const file$3 = "src/PlaylistDeck.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.element = list[i];
    	return child_ctx;
    }

    // (45:0) {:catch error}
    function create_catch_block(ctx) {
    	var p, t_value = ctx.error, t;

    	return {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr(p, "class", "center svelte-3bl96m");
    			add_location(p, file$3, 45, 0, 820);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.playlists) && t_value !== (t_value = ctx.error)) {
    				set_data(t, t_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (39:0) {:then array}
    function create_then_block(ctx) {
    	var div, current;

    	var each_value = ctx.array;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div, "class", "card-columns center svelte-3bl96m");
    			add_location(div, file$3, 39, 0, 695);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.playlists) {
    				each_value = ctx.array;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (41:0) {#each array as element}
    function create_each_block(ctx) {
    	var current;

    	var playlistcard = new PlaylistCard({
    		props: { playlist: ctx.element },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			playlistcard.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(playlistcard, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var playlistcard_changes = {};
    			if (changed.playlists) playlistcard_changes.playlist = ctx.element;
    			playlistcard.$set(playlistcard_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(playlistcard.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(playlistcard.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(playlistcard, detaching);
    		}
    	};
    }

    // (37:18)  <Spinner /> {:then array}
    function create_pending_block(ctx) {
    	var current;

    	var spinner = new Spinner({ $$inline: true });

    	return {
    		c: function create() {
    			spinner.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var await_block_anchor, promise, current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 'array',
    		error: 'error',
    		blocks: [,,,]
    	};

    	handle_promise(promise = ctx.playlists, info);

    	return {
    		c: function create() {
    			await_block_anchor = empty();

    			info.block.c();
    		},

    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, await_block_anchor, anchor);

    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;

    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (('playlists' in changed) && promise !== (promise = ctx.playlists) && handle_promise(promise, info)) ; else {
    				info.block.p(changed, assign(assign({}, ctx), info.resolved));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(await_block_anchor);
    			}

    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { token } = $$props;

    	const loadPlaylists = async (token) => {
    		let response = await fetch(`/playlists/${token}`, {
    			method: 'POST',
    			body: {
    				token: token
    			}
    		});
    		let array = response.json();
    		if(response.ok){
    			return array;
    		}
    		else{
    			throw new Error(res.text());
    		}
    	};

    	const writable_props = ['token'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<PlaylistDeck> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('token' in $$props) $$invalidate('token', token = $$props.token);
    	};

    	let playlists;

    	$$self.$$.update = ($$dirty = { token: 1 }) => {
    		if ($$dirty.token) { $$invalidate('playlists', playlists = loadPlaylists(token)); }
    	};

    	return { token, playlists };
    }

    class PlaylistDeck extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$3, safe_not_equal, ["token"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.token === undefined && !('token' in props)) {
    			console.warn("<PlaylistDeck> was created without expected prop 'token'");
    		}
    	}

    	get token() {
    		throw new Error_1("<PlaylistDeck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error_1("<PlaylistDeck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.7 */

    // (13:0) {:else}
    function create_else_block(ctx) {
    	var current;

    	var playlistdeck = new PlaylistDeck({
    		props: { token: ctx.token },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			playlistdeck.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(playlistdeck, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var playlistdeck_changes = {};
    			if (changed.token) playlistdeck_changes.token = ctx.token;
    			playlistdeck.$set(playlistdeck_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(playlistdeck.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(playlistdeck.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(playlistdeck, detaching);
    		}
    	};
    }

    // (11:0) {#if !token}
    function create_if_block(ctx) {
    	var current;

    	var logincard = new LoginCard({ $$inline: true });

    	return {
    		c: function create() {
    			logincard.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(logincard, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(logincard.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(logincard.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(logincard, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (!ctx.token) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let cookies, token;

    	$$self.$$.update = ($$dirty = { cookies: 1 }) => {
    		if ($$dirty.cookies) { $$invalidate('token', token = cookies[0].split('=')[1]); }
    	};

    	$$invalidate('cookies', cookies = document.cookie.split(';'));

    	return { token };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* jshint esversion: 9 */

    const app = new App({
    	target: document.querySelector('#app'),
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
