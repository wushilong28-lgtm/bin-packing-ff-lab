# Bin Packing Research Lab

An interactive, browser-only experiment comparing two bin packing models under four online placement algorithms.

The [hosted demo](https://bin-packing-ff-lab.wushilong28.chatgpt.site/) may still show an earlier version than this repository.

## Models

There are unlimited bins of capacity 1. Jobs arrive in order, with independent true sizes $a_i\sim\mathrm{Uniform}(0,1)$. The selected placement algorithm uses the size available to its model. If no eligible bin fits, it opens a new bin. The objective is the number of bins used.

- **Model 1: true sizes.** The browser packs jobs using $a_i$.
- **Model 2: reported sizes.** First calculate perceived size $z_i=\mathrm{clip}(a_i+\varepsilon_i,0,1)$. A job chooses Simple mode with probability $g(z_i)$ and Hard mode otherwise. Simple mode reports $\min(t_s,z_i)$; Hard mode reports $\max(t_l,z_i)$. The browser packs using only these reported sizes. True sizes do not directly affect mode selection or placement in this model.

Both models use the same algorithm and, within each trial, the same true jobs and arrival order. Random Fit makes independent random placement choices for each model. Trials are independent. The charts show mean bin counts, 5th–95th percentile ranges, and paired differences in bin counts between the models.

## Placement algorithms

- **First Fit:** Scan bins in opening order and use the first one with enough remaining capacity.
- **Best Fit:** Use the fitting bin that leaves the least unused capacity, breaking ties by opening order.
- **Next Fit:** Try only the current bin; open a new bin when the job does not fit, and never revisit older bins.
- **Random Fit:** Choose uniformly at random among all fitting open bins; open a new bin when none fits.

## Settings

- Jobs per trial: 500–5000; trials: 1–300.
- Simple-mode probability $g(z)$: choose a preset or enter an expression such as `1-z`, `z^2`, or `1/(1+exp(12*(z-0.5)))`. The expression must yield a finite value in $[0,1]$ for all $z\in[0,1]$.
- Judgment error: none, normal, uniform, Laplace, symmetric triangular, Cauchy, centered exponential, or two-point.
- Simple-mode upper bound $t_s$, Hard-mode lower bound $t_l$, and error scale.

## Run locally

Keep the four web files in one directory and serve them with any static HTTP server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`. The experiment runs entirely in the browser; it does not upload jobs or results.

## Files

- `index.html`: page structure and text.
- `styles.css`: layout and styles.
- `probability.js`: probability-expression parser and validation. It does not evaluate user-supplied JavaScript.
- `app.js`: sampling, error distributions, placement algorithms, and charts.
