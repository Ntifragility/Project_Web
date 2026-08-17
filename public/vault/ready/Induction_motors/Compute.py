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