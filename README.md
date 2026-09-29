# Bin Packing · First Fit Lab

An interactive, browser-only experiment comparing two online First Fit (FF) bin packing models.

**[Open the live experiment](https://bin-packing-ff-lab.wushilong28.chatgpt.site/)**

## Models

There are unlimited bins of capacity 1. Jobs arrive in order, with independent true sizes $a_i\sim\mathrm{Uniform}(0,1)$. FF scans bins in opening order and places each job in the first bin with enough remaining capacity under the size used by the current model. If none fits, it opens a new bin. The objective is the number of bins used.

- **Model 1: true sizes.** The server runs FF using $a_i$.
- **Model 2: reported sizes.** A job chooses Simple mode with probability $g(a_i)$ and Hard mode otherwise. Let $z_i=\operatorname{clip}(a_i+\varepsilon_i,0,1)$. Simple mode reports $\min(t_s,z_i)$; Hard mode reports $\max(t_l,z_i)$. The server runs FF using only the reported sizes. True sizes do not affect placement in this model.

Within each trial, the models share the same true jobs and arrival order. Trials are independent. The charts show mean bin counts, 5th–95th percentile ranges, and paired differences in bin counts between the models.

## Settings

- Jobs per trial: 500–5000; trials: 1–300.
- Simple-mode probability $g(a)$: choose a preset or enter an expression such as `1-a`, `a^2`, or `1/(1+exp(12*(a-0.5)))`. The expression must yield a finite value in $[0,1]$ for all $a\in[0,1]$.
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
- `app.js`: sampling, error distributions, FF, and charts.
