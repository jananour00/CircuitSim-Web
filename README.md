
Advanced Circuit Simulator
A Rigorous, High-Precision DC Circuit Analysis Tool using Modified Nodal Analysis (MNA)


🎥 Watch Demo Video (coming soon)

📌 Table of Contents
Overview

Key Features

Mathematical Foundations

Numerical Methods

Workflow

Example Analysis

Verification & Validation

Advanced Extensions

Future Roadmap

Demo Video

📖 Overview
The Advanced Circuit Simulator is designed to perform accurate, stable, and verifiable DC circuit analysis using Modified Nodal Analysis (MNA).
It’s not just a black-box solver — it’s an educational and professional tool that lets you:

See the full equation system your circuit produces

Understand matrix assembly from physical components

Verify your results against KCL, KVL, and power conservation

Extend to AC, nonlinear, and transient analyses

🚀 Key Features
🔍 Accurate MNA Implementation for DC steady-state analysis

📐 Union-Find Node Detection for correct topology mapping

⚙️ LU Decomposition with Partial Pivoting for stable solving

📊 Post-Processing: per-component currents & power

✅ Automatic Verification of physical conservation laws

📈 Residual Norm & Condition Number reporting

🔄 Ground Node Reduction for efficiency

🛠 Educational Mode showing intermediate matrices

📚 Mathematical Foundations
Problem Setup
Given a circuit with:

𝑛
n non-ground nodes

𝑚
m voltage sources

The MNA formulation is:

[
𝐺
𝐵
𝐵
𝑇
0
]
[
𝑉
𝐼
]
=
[
𝐼
𝑠
𝑉
𝑠
]
[ 
G
B 
T
 
​
  
B
0
​
 ][ 
V
I
​
 ]=[ 
I 
s
​
 
V 
s
​
 
​
 ]
Where:

𝐺
G: Conductance matrix (Ohm’s law contributions)

𝐵
B: Voltage source incidence matrix

𝐼
𝑠
I 
s
​
 : Current injection vector

𝑉
𝑠
V 
s
​
 : Voltage source vector

Dimension: 
(
𝑛
+
𝑚
)
×
(
𝑛
+
𝑚
)
(n+m)×(n+m)

🔢 Numerical Methods
The simulator is numerically robust thanks to careful preprocessing and solving strategies.

1. Ground Node Reduction
We select one node as reference (ground) and remove its row and column from the MNA system.

Why?

Ground voltage is fixed (
𝑉
𝑔
=
0
V 
g
​
 =0) → no need to solve for it

Reduces size from 
(
𝑛
+
𝑚
)
(n+m) to 
(
𝑛
+
𝑚
−
1
)
(n+m−1)

Improves conditioning by removing a trivial equation

2. LU Decomposition with Partial Pivoting
We solve:

𝐴
𝑟
𝑒
𝑑
⋅
𝑥
𝑟
𝑒
𝑑
=
𝑧
𝑟
𝑒
𝑑
A 
red
​
 ⋅x 
red
​
 =z 
red
​
 
Using the factorization:

𝑃
⋅
𝐴
𝑟
𝑒
𝑑
=
𝐿
⋅
𝑈
P⋅A 
red
​
 =L⋅U
𝐿
L: Lower triangular (1’s on diagonal)

𝑈
U: Upper triangular

𝑃
P: Row permutation matrix (from pivoting)

Partial Pivoting:

Finds the largest pivot element in the current column

Swaps rows to place it on the diagonal

Prevents division by small numbers

Reduces round-off error growth

Algorithm (Doolittle with Pivoting):

For column 
𝑘
k:

𝑝
=
arg
⁡
max
⁡
𝑖
≥
𝑘
∣
𝐴
[
𝑖
,
𝑘
]
∣
p=argmax 
i≥k
​
 ∣A[i,k]∣

Swap rows 
𝑘
k and 
𝑝
p in 
𝐴
A, update 
𝑃
P

For rows 
𝑖
>
𝑘
i>k:

𝐿
[
𝑖
,
𝑘
]
=
𝐴
[
𝑖
,
𝑘
]
𝐴
[
𝑘
,
𝑘
]
L[i,k]= 
A[k,k]
A[i,k]
​
 
Update:

𝐴
[
𝑖
,
𝑗
]
=
𝐴
[
𝑖
,
𝑗
]
−
𝐿
[
𝑖
,
𝑘
]
⋅
𝐴
[
𝑘
,
𝑗
]
A[i,j]=A[i,j]−L[i,k]⋅A[k,j]
After factorization:

Forward substitution: 
𝐿
⋅
𝑦
=
𝑃
⋅
𝑧
𝑟
𝑒
𝑑
L⋅y=P⋅z 
red
​
 

Backward substitution: 
𝑈
⋅
𝑥
𝑟
𝑒
𝑑
=
𝑦
U⋅x 
red
​
 =y

Complexity:

𝑂
(
(
𝑛
+
𝑚
)
3
)
O((n+m) 
3
 ) worst-case for dense systems

Reduced by ground removal

3. Residual & Accuracy Checks
After solving:

𝑟
=
∥
𝐴
𝑟
𝑒
𝑑
𝑥
𝑟
𝑒
𝑑
−
𝑧
𝑟
𝑒
𝑑
∥
2
r=∥A 
red
​
 x 
red
​
 −z 
red
​
 ∥ 
2
​
 
Goal: 
𝑟
≤
10
−
10
r≤10 
−10
 

Large residual → possible ill-conditioning or singularity

4. Condition Number Analysis
The simulator computes:

𝜅
(
𝐴
)
=
∥
𝐴
∥
⋅
∥
𝐴
−
1
∥
κ(A)=∥A∥⋅∥A 
−1
 ∥
High 
𝜅
(
𝐴
)
κ(A) → sensitive to rounding & component tolerances

Helps detect unstable circuits before trusting results

5. Error Handling
Singular matrix detection → missing connections or floating subcircuits

Ill-conditioning warnings → extreme resistor ratios (e.g., 
1
Ω
1Ω with 
1
𝑀
Ω
1MΩ)

🛠 Workflow
mermaid
Copy
Edit
graph TD;
    A[Component & Wire Input] --> B[Node Identification (Union-Find)]
    B --> C[MNA Matrix Assembly (G, B, I_s, V_s)]
    C --> D[Ground Node Reduction]
    D --> E[LU Decomposition & Solve]
    E --> F[Post-Processing (Currents & Powers)]
    F --> G[Verification (KCL, KVL, Power)]
💡 Example Analysis — Voltage Divider
Circuit:

Vs = 12 V

R1 = 1 kΩ

R2 = 2 kΩ

Results:

Quantity	Value
V₂	8 V
I	4 mA
P_R1	16 mW
P_R2	32 mW
P_Vs	-48 mW

✅ KCL/KVL & Power Conservation verified.

✅ Verification & Validation
KCL: Currents at every node sum to ≈ 0

KVL: Loop voltages sum to ≈ 0

Power: Total supplied = total consumed

Residual Norm: Reports how close numerical solution is to exact

Condition Number: Alerts on stability risk
