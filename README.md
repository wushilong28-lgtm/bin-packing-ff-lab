# Bin Packing Research Lab

An interactive, browser-only research lab with a basic bin-count experiment and a separate Green Bin Packing cost experiment.

The [hosted demo](https://bin-packing-ff-lab.wushilong28.chatgpt.site/) may still show an earlier version than this repository.

## Basic experiment (`index.html`)

There are unlimited bins of capacity 1. Jobs arrive in order, with independent true sizes $a_i\sim\mathrm{Uniform}(0,1)$. The selected placement algorithm uses the size available to its model. If no eligible bin fits, it opens a new bin. The objective is the number of bins used.

- **Model 1: true sizes.** The browser packs jobs using $a_i$.
- **Model 2: reported sizes.** First calculate perceived size $z_i=\mathrm{clip}(a_i+\varepsilon_i,0,1)$. A job chooses Hard mode with probability $g(z_i)$ and Simple mode otherwise. Simple mode reports $\min(t_s,z_i)$; Hard mode reports $\max(t_l,z_i)$. The browser packs using only these reported sizes. True sizes do not directly affect mode selection or placement in this model.

Both models use the same algorithm and, within each trial, the same true jobs and arrival order. Random Fit makes independent random placement choices for each model. Trials are independent. The charts show mean bin counts, 5th–95th percentile ranges, and paired differences in bin counts between the models.

## Placement algorithms

- **First Fit:** Scan bins in opening order and use the first one with enough remaining capacity.
- **Best Fit:** Use the fitting bin that leaves the least unused capacity, breaking ties by opening order.
- **Next Fit:** Try only the current bin; open a new bin when the job does not fit, and never revisit older bins.
- **Random Fit:** Choose uniformly at random among all fitting open bins; open a new bin when none fits.

## Settings

- Jobs per trial: 500–5000; trials: 1–300.
- Hard-mode probability $g(z)$: choose a preset or enter an expression such as `1-z`, `z^2`, or `1/(1+exp(-12*(z-0.5)))`. The expression must yield a finite value in $[0,1]$ for all $z\in[0,1]$.
- Judgment error: none, normal, uniform, Laplace, symmetric triangular, Cauchy, centered exponential, or two-point.
- Simple-mode upper bound $t_s$, Hard-mode lower bound $t_l$, and error scale.

## Green experiment (`green.html`)

The Green page starts with the same reporting pipeline: true size $a_i$, perceived size $z_i=\mathrm{clip}(a_i+\varepsilon_i,0,1)$, Hard mode selected with probability $g(z_i)$ (Simple otherwise), and final reported size $r_i$. **All Green placement decisions and all Green costs use only $r_i$.** True-size bin loads, including any actual load above 1, are not checked or charged.

Bins have reported capacity 1. Let $G\in[0,1]$ be the green fill level, $\beta>0$ the price per unit of reported fill above it, and $B$ the number of bins opened. For reported bin loads $L_j$, the objective is

$$C = B + \beta\sum_j\max(0,L_j-G).$$

The threshold parameter $\tau\in[0,1-G]$ gives an effective packing capacity $G+\tau$. Each threshold algorithm normally places a reported item only where the resulting load is at most $G+\tau$. A single reported item larger than $G+\tau$ occupies its own bin, up to the physical reported capacity 1. The page compares threshold First Fit, Best Fit, Next Fit, Worst Fit, and Harmonic with 10 size classes. It also shows full-capacity First Fit as a reference. All algorithms process the same reported sequence within each trial, and a user-set seed makes trials reproducible. Reported item sizes may be zero after clipping or a zero Simple cap; those still count as arrivals.

The page reports mean total cost, opening cost, black-space cost, bin count, and black-space volume per trial. For the original known-size threshold formulation, see Bibbens et al., *Green Bin Packing* (arXiv:2510.26968). Applying it to reported sizes is this lab's extension.

## Run locally

Keep the web files together and serve them with any static HTTP server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/` for the basic page or `http://localhost:8000/green.html` for the Green page. The experiments run entirely in the browser; they do not upload jobs or results.

## Files

- `index.html`: page structure and text.
- `styles.css`: layout and styles.
- `probability.js`: probability-expression parser and validation. It does not evaluate user-supplied JavaScript.
- `app.js`: sampling, error distributions, placement algorithms, and charts.
- `green.html`: separate Green Bin Packing experiment page.
- `green-core.js`: seeded reporting, threshold placement, and cost calculation.
- `green.js`: Green page form, comparison, and display.
- `tests/green-core.test.js`: deterministic reporting, placement, and cost checks (`node --test tests/green-core.test.js`).
