---
title: Calculation of PF at different levels of load in a 3-ph induction motor
category: Induction_motors
date: 2026-08-17
image:
---
# Calculation of PF at different levels of load in a 3-ph induction motor

Using a motor's datasheet to compare PF at different levels of load

|          **SPECIFICATIONS**          |     **VALUES**      | **UN** |  **SYMBOL**   |
| :----------------------------------: | :-----------------: | :----: | :-----------: |
|             Output Power             |         150         |   HP   |      $P$      |
|            Rated Voltage             |         460         |   v    |     $V_n$     |
|            Rated current             |         180         |   A    |     $I_n$     |
|           No load Current            |         73          |   A    | $I_{no-load}$ |
| Efficiency (100/75/50 % of the load) | 0.958 /0.949 /0.937 |   -    |    $\eta$     |
|                  PF                  |          ?          |   -    |     $PF$      |
## Equations needed

Input power (VA):
$$S = \sqrt3*V_n*I_n
$$
Mechanical to electrical power (W):
$$P = \frac{746*HP}{\eta}
$$
Active Current (A):
$$I_{active} = \cos(\phi)*I_{total}
$$
Reactive Current (A):
$$I_{reactive} = I_{no-load} + I_{leakage}
$$
Total Current (A):
$$I_{total} = \sqrt {I_{active}^2 + I_{reactive}^2}
$$
PF at different load levels:
$$PF = \frac{P}{S}
$$
$$PF = \frac{I_{active}}{I_{total}}
$$
Considerations:
At 100 % of load, $I_{total} = I_{n}$ but at lower levels, that changes.

## Computing PF at 100% load level

At 100 % level of load: $I_{total} = I_{n}$
$$PF = \frac{P}{S} = \frac{I_{active}}{I_{total}} = \frac{746*HP}{\eta*\sqrt3*V_n*I_n} 
$$
$$ I_{active} = \frac{746*150}{0.958*\sqrt3*460} = 146.6 \ A
$$
$$ \boxed{
I_{active} = 146.6 \ A}
$$
$$\boxed{
PF_{100\%} = \frac{146.6}{180} = 0.81}
$$

When it comes to reactive current $I_{reactive}$, its basically divided into two components.:
* $I_{no-load}$ is constant, also called magnetization current $I_0$ because lays in the magnetization branch of the 1-ph model of the induction motor thanks to the magnetization flux $\Phi_m$
* $I_{leakage}$ is no-constant, and comes from the magnetization of coils in the series branch of the model, thanks to the leakage flux $\Phi_l$

Finding $I_{leakage}$ at 100% load because it will be needed in the next sections:
$$180= \sqrt { 146.6^2 + (73 + I_{leakage-100\%})^2}
$$
$$\boxed{
I_{leakage-100\%} = 31.44 \ A }
$$
## Computing PF at 75% load level

When load is at 75%, $I_{active}$ and $I_{reactive}$ change, so $I_{total}$ lowers. From this point $I_{total} \neq I_{n}$
Efficiency $\eta$ also changes with % of load. (inverse proportionality) So:
$$I_{active} \propto \frac{1}{\eta}
$$
The new value of efficiency is $\eta2 = 0.949$, so 
$$I_{active-\eta2} = I_{active-\eta1} \left(\frac{\eta1}{\eta2}\right)
$$
$$I_{active-\eta2} = 146.52 \left(\frac{0.958}{0.949}\right) = 147.9 \ A
$$
So far, that's the active power at a new level of efficiency
$$I_{active-100\%} =I_{active-\eta2}
$$
Let's find out the new levels of current at 75 %, based on the values at 100%:
$$I_{active-75\%} = 0.75*I_{active-100\%} = 0.75*147.9
$$
$$\boxed{
I_{active-75\%} = 111 \ A}
$$
$$I_{leakage-75\%} = 0.75*I_{leakage-100\%}=0.75*31.56$$
$$\boxed{
I_{leakage-75\%} = 23.58 \ A }
$$
$$I_{total-75\%} = \sqrt {I_{active-75\%}^2 + I_{reactive-75\%}^2}
$$
$$I_{total-75\%} = \sqrt {111^2 + (73+23.58)^2} = 147.13 \ A
$$
$$\boxed{
I_{total-75\%} = 147.13 \ A}
$$
$$\boxed{
PF_{75\%} = \frac{110.9}{147.13} = 0.75}
$$
## Computing PF at 50% load level

Proceeding is similar to the previous case. The new value of efficiency is $\eta3 = 0.937$, so 
$$I_{active-\eta3} = I_{active-\eta1} \left(\frac{\eta1}{\eta3}\right)
$$
$$I_{active-\eta3} = 146.6 \left(\frac{0.958}{0.937}\right) = 149.8 \ A
$$
So far, that's the active power at a new level of efficiency
$$I_{active-100\%} =I_{active-\eta3}
$$
Let's find out the new levels of current at 50 %, based on the values at 100%:
$$I_{active-50\%} = 0.50*I_{active-100\%} = 0.50*149.8
$$
$$\boxed{
I_{active-50\%} = 74.9 \ A}
$$
$$I_{leakage-50\%} = 0.50*I_{leakage-100\%}=0.50*31.44 
$$
$$\boxed{
I_{leakage-50\%} = 15.72 \ A }
$$
$$I_{total-50\%} = \sqrt {I_{active-50\%}^2 + I_{reactive-50\%}^2}
$$
$$I_{total-50\%} = \sqrt {74.9^2 + (73+15.8)^2} = 116.1 \ A
$$
$$\boxed{
I_{total-50\%} = 116.1 \ A}
$$
$$ \boxed{ 
PF_{50\%} = \frac{74.9}{116.1} = 0.65}
$$
## Comparing these values to the vendor's datasheet

![[Motors_Datasheet.png]]

The values found through calculation match the datasheet table almost perfectly, confirming that the physics of the variable leakage model is exactly how this motor performs in reality.

## Conclusions

* At different loads, $I_{active}$ has a linear relationship to $I_{active-100\%}$
* At different loads, $I_{reactive}$ has no linear relationship, because $I_{no-load}$ is constant. Only $I_{leakage}$ is proportional.
$$I_{reactive} = I_{no-load} + I_{leakage}
$$
* Magnetization flux $\Phi_m$ does not change according to Faraday's Law:
$$V_{rms} \approx E_1 = N_1*\frac{d\Phi_m}{dt}
$$
$$\Phi_{m-max} = \frac{V_{rms}}{4.44*f*N1}
$$
* Leakage flux $\Phi_l$ changes because it links windings and the current going through them. It's based on the flux linkage definition (1st) and magnetic circuit theory (2nd)
$$\Phi_{l} = \frac{L_l*I_{leakage}}{N}
$$
$$\Phi_{l} = \frac{N*I_{leakage}}{R_l}
$$
## Python Script

![[Python_PF.png ]]

Using the next script only takes changing the values in 1. INPUT DATA from any induction motor's datasheet.

```python
"""
Calculation of PF at different levels of load in a 3-ph induction motor
"""
import math
from sympy import symbols, Eq, sqrt, solve
from tabulate import tabulate

# ── 0. METADATA ───────────────────────────────────────────────────────────────────────
PROJECT  = "PF at Different Loads in Induction Motors"
CALC_REF = "CALC-ELEC-001"
DATE     = "02.18.26"

# ── 1. INPUT DATA ──────────────────────────────────────────────────────────────────────
HP_val = 150        # hp
Vn_val = 460        # Vnominal
In_val = 180        # Inominal
I0_val = 73         # A (no-load current)
load_cases = [      # Different % of loads
    {"label": "100%", "load_val": 1.00, "eta": 0.958},
    {"label": "75%",  "load_val": 0.75, "eta": 0.949},
    {"label": "50%",  "load_val": 0.50, "eta": 0.937},
]

# ── 2. SYMBOLS ─────────────────────────────────────────────────────────────────────────
In, I0       = symbols(r'In I0', positive=True)  # active current
I_act        = symbols(r'I_act', positive=True)  # active current
I_leakage    = symbols(r'I_leakage', positive=True)  # reactive, leakage current

# ── 3. SYMBOLIC EQUATIONS ───────────────────────────────────────────────────────────────
eq_Ileakage = Eq(In, sqrt(I_act**2 + (I0 + I_leakage)**2))

# ── 4. NUMERICAL EVALUATION ─────────────────────────────────────────────────────────────
I_act_temp = (746 * HP_val * 1.0) / (load_cases[0]["eta"] * math.sqrt(3) * Vn_val)

I_leak_expr     = solve(eq_Ileakage, I_leakage)[1]  # Rearrange eq for I_leakage (root 2)
I_leakage_temp   = float(I_leak_expr.subs({In: In_val, I_act: I_act_temp, I0: I0_val}))

results = []
for case in load_cases:
        I_act_val     = (I_act_temp * load_cases[0]["eta"] / case["eta"]) * case["load_val"]  # load * I_active
        I_leakage_val = I_leakage_temp * case["load_val"]  # load * I_leakage 
        Itot_val      = math.sqrt(I_act_val**2 + (I0_val + I_leakage_val)**2)  
        PF            = I_act_val/Itot_val
        results.append([case["load_val"], I_act_val, I_leakage_val, Itot_val, PF])

# ── 5. OUTPUT ──────────────────────────────────────────────────────────────────────────
def section(title: str):
    w = 72
    print(f"\n{'═' * w}")
    print(f"  {title}")
    print(f"{'═' * w}")

def main():
    section(f"{PROJECT} | {CALC_REF} | {DATE}")

    section("Input Parameters") # Print input table
    inputs = [
        ["Rated Power",     HP_val, "HP"],
        ["Rated Voltage", Vn_val, "V" ],
        ["Rated Current", In_val, "A" ],
        ["No-load Current", I0_val, "A" ],
    ]
    print(tabulate(inputs,
                   headers=["Parameter", "Value", "Unit"],
                   tablefmt="rounded_outline"))

    section("Results")          # Print results table
    print(tabulate(results,
                   headers=["Load", "I_active (A)", "I_leakage (A)", "I_total (A)", "PF"],
                   tablefmt="rounded_outline",
                   floatfmt=".2f"))
    print()

if __name__ == "__main__":
    main()
```


