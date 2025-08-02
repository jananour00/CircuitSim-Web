
# ⚡ Advanced Circuit Simulator

*A Rigorous, High-Precision DC Circuit Analysis Tool using Modified Nodal Analysis (MNA)*

![Demo](20250802-1527-21.9009863(1).gif)

---

## 📌 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Mathematical Foundations](#mathematical-foundations)
4. [Numerical Methods](#numerical-methods)
5. [Workflow](#workflow)
6. [Example Analysis](#example-analysis)
7. [Verification & Validation](#verification--validation)
8. [Advanced Extensions](#advanced-extensions)
9. [Future Roadmap](#future-roadmap)
10. [Demo Video](#demo-video)

---

## 📖 Overview

The **Advanced Circuit Simulator** is designed to perform **accurate, stable, and verifiable DC circuit analysis** using **Modified Nodal Analysis (MNA)**.
It’s not just a black-box solver — it’s an **educational and professional tool** that lets you:

* See the **full equation system** your circuit produces
* Understand **matrix assembly** from physical components
* Verify your results against **KCL, KVL, and power conservation**
* Extend to AC, nonlinear, and transient analyses

---

## 🚀 Key Features

* 🔍 **Accurate MNA Implementation** for DC steady-state analysis
* 📐 **Union-Find Node Detection** for correct topology mapping
* ⚙️ **LU Decomposition with Partial Pivoting** for stable solving
* 📊 **Post-Processing**: per-component currents & power
* ✅ **Automatic Verification** of physical conservation laws
* 📈 **Residual Norm & Condition Number** reporting
* 🔄 **Ground Node Reduction** for efficiency
* 🛠 **Educational Mode** showing intermediate matrices

---

## 📚 Mathematical Foundations

**Problem Setup**
Given a circuit with:

* $n$ non-ground nodes
* $m$ voltage sources

The **MNA formulation** is:

$$
\begin{bmatrix}
G & B \\
B^T & 0
\end{bmatrix}
\begin{bmatrix}
V \\
I
\end{bmatrix}
=
\begin{bmatrix}
I_s \\
V_s
\end{bmatrix}
$$

Where:

* $G$: Conductance matrix (Ohm’s law contributions)
* $B$: Voltage source incidence matrix
* $I_s$: Current injection vector
* $V_s$: Voltage source vector

**Dimension**: $(n+m) \times (n+m)$

---

## 🔢 Numerical Methods

The simulator is **numerically robust** thanks to careful preprocessing and solving strategies.

### **1. Ground Node Reduction**

We select one node as **reference (ground)** and remove its row and column from the MNA system.

* **Why?**

  * Ground voltage is fixed ($V_g = 0$) → no need to solve for it
  * Reduces size from $(n+m)$ to $(n+m-1)$
  * Improves **conditioning** by removing a trivial equation

---

### **2. LU Decomposition with Partial Pivoting**

We solve:

$$
A_{red} \cdot x_{red} = z_{red}
$$

Using the factorization:

$$
P \cdot A_{red} = L \cdot U
$$

* $L$: Lower triangular (1’s on diagonal)
* $U$: Upper triangular
* $P$: Row permutation matrix (from pivoting)

**Partial Pivoting**:

* Finds the largest pivot element in the current column
* Swaps rows to place it on the diagonal
* Prevents division by small numbers
* Reduces round-off error growth

**Algorithm** (Doolittle with Pivoting):

1. For column $k$:

   * $p = \arg\max_{i \ge k} |A[i,k]|$
   * Swap rows $k$ and $p$ in $A$, update $P$
   * For rows $i > k$:

     $$
     L[i,k] = \frac{A[i,k]}{A[k,k]}
     $$

     Update:

     $$
     A[i,j] = A[i,j] - L[i,k] \cdot A[k,j]
     $$
2. After factorization:

   * **Forward substitution**: $L \cdot y = P \cdot z_{red}$
   * **Backward substitution**: $U \cdot x_{red} = y$

**Complexity**:

* $O((n+m)^3)$ worst-case for dense systems
* Reduced by ground removal

---

### **3. Residual & Accuracy Checks**

After solving:

$$
r = \|A_{red} x_{red} - z_{red}\|_2
$$

* Goal: $r \leq 10^{-10}$
* Large residual → possible ill-conditioning or singularity

---

### **4. Condition Number Analysis**

The simulator computes:

$$
\kappa(A) = \|A\| \cdot \|A^{-1}\|
$$

* High $\kappa(A)$ → sensitive to rounding & component tolerances
* Helps detect **unstable circuits** before trusting results

---

### **5. Error Handling**

* **Singular matrix detection** → missing connections or floating subcircuits
* **Ill-conditioning warnings** → extreme resistor ratios (e.g., $1\Omega$ with $1M\Omega$)

---

## 🛠 Workflow

```mermaid
graph TD;
    A[Component & Wire Input] --> B[Node Identification (Union-Find)]
    B --> C[MNA Matrix Assembly (G, B, I_s, V_s)]
    C --> D[Ground Node Reduction]
    D --> E[LU Decomposition & Solve]
    E --> F[Post-Processing (Currents & Powers)]
    F --> G[Verification (KCL, KVL, Power)]
```

---

## 💡 Example Analysis — Voltage Divider

**Circuit**:

* Vs = 12 V
* R1 = 1 kΩ
* R2 = 2 kΩ

**Results**:

| Quantity | Value  |
| -------- | ------ |
| V₂       | 8 V    |
| I        | 4 mA   |
| P\_R1    | 16 mW  |
| P\_R2    | 32 mW  |
| P\_Vs    | -48 mW |

✅ **KCL/KVL & Power Conservation verified**.

---

## ✅ Verification & Validation

* **KCL**: Currents at every node sum to ≈ 0
* **KVL**: Loop voltages sum to ≈ 0
* **Power**: Total supplied = total consumed
* **Residual Norm**: Reports how close numerical solution is to exact
* **Condition Number**: Alerts on stability risk

---

## 🔬 Advanced Extensions

* 🌀 **AC Phasor Analysis**
* 📉 **Nonlinear Components** with Newton-Raphson
* 🎯 **Sensitivity & Monte Carlo** parameter analysis
* ⚡ **Sparse Matrix Solver** for large-scale systems

---

## 🗺 Future Roadmap

* [ ] Transient (time-domain) analysis
* [ ] Complex AC solver
* [ ] GUI circuit builder
* [ ] WebAssembly performance boost

---

## 🎥 Demo Video

📌 Coming soon: **matrix building, solving, and results visualized**
👉 **[YouTube Placeholder Link](https://youtu.be/demo)**

---

## 📜 License

MIT License — free to use, modify, and distribute.

---






