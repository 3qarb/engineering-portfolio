# Villa project — review

Revised 2026-11-22 against the master model **`VILLA_Master File - Try Modifieres.EDB`** (ETABS v20.3,
27 Sep 2026), plus the 19 structural sheets (S-201 to S-219), the Model Report (12 Sep 2026) and the SAFE
foundation model. The master was opened **as a copy** in ETABS 22.7, saved to a temporary folder, analysed
and run through concrete design there. The file in the project folder was not changed.

> Correction to the first review: the November files with 300 mm columns (`VILLA_Master File- claude*`)
> were not the design. They have been removed from the folder, and they played no part in this review.
> The master uses 200 mm members throughout, as the drawings do.

This is a consistency and design-check review with ETABS. It does not replace an independent check.

## 1. Master model vs drawings and report

| Item | Master model | Drawings | Report (12 Sep) |
|---|---|---|---|
| Columns | 200 × 400 – 900, 4T14 – 16T16 | 200 × 400 – 900 (S-205) | same, except below |
| Ground-floor perimeter columns C30–C51, C60, C62 | **200 × 400, 4T14** | C1 = 200 × 400 on S-209 | 200 × 500, 8T16 |
| Beams | 200 × 600 (one 200 × 800) | B1 200 × 400; B2–B5 200 × 600 (S-212) | same as master |
| Story heights | 2.15 / 4.05 / 3.90 / 3.40 m | +4.70, **+8.45**, +12.00 | same as master |
| Seismic | user coefficient **0.01**, k = 1.2 | "SDC A, F = 0.01 W" (S-201) | 0.01 W |
| Combinations | U1–U15 (1.4D; 1.4D + 1.7L; 1.2D + 0.5L ± W/E; 0.9D ± W/E) | different list on S-201 | same as master |
| Stiffness modifiers | beams 0.35 (J, I2, I3), columns 0.75 | — | same |
| Concrete | FC 28 (27.5 MPa) | 30 MPa | FC 28 |

The master is newer than the report and agrees with the drawings on the perimeter columns, so the
portfolio now follows the master.

## 2. ETABS analysis of the master

- Dead load 13,876 kN; live 1,472 kN; seismic base shear 137 kN = 0.0099 W.
- Wind (ASCE 7-16, 112 mph, exposure B) governs the lateral design: up to 276 kN.
- Largest story drift 0.00122 (1/820).
- First mode 1.30 s with 26 % of the X mass: a long, local mode, worth a look.

## 3. Concrete design of the master (ACI 318-19, as set in the model)

**As the model is set up, every beam fails**: all 218 beams, at every station, report "shear stress due
to shear force and torsion together exceeds maximum allowed".

The cause is a setting, not the beams. The design preferences say **seismic design category D** (SDS 0.5),
so ETABS designs every beam with a program-determined frame type as a **special** moment-frame beam,
with capacity-design shear (≈ 73 kN almost constant along a ground beam). The columns are set to
**Ordinary**, and S-201 says category A. Tested on the copy:

| Setting tested | Beams with errors |
|---|---|
| As modelled (SDC D, beams program-determined, J = 0.35) | 218 / 218 (all stations) |
| Beams set to **Sway Ordinary**, SDC A, J = 0.35 | **16 beams, 46 stations**: R.F B37, B85 · F.F B34, B37, B40, B46, B85 · G.F B19, B37, B40, B46 · G.B B1, B3, B36, B40, B46 |
| Beams Sway Ordinary, SDC A, beam **J = 0.01** | **0** — all 2,968 stations pass |

The 16 remaining beams carry **compatibility torsion** from beams framing into them (ground beam B1:
23.7 kN·m at J = 0.35, 3.2 kN·m at J = 0.01). ACI 318-19 §22.7.3.2 allows that torsion to be reduced to
the cracking torsion where redistribution can occur; a low torsional modifier is the usual way to model it.
Decide which approach to use and state it.

With Ordinary beams, the largest design actions are moderate:

- shear 167 kN (G.F B40), shear steel ≤ 550 mm²/m — within T10@150 two legs (≈ 1,047 mm²/m);
- bottom steel up to 550 mm² (G.F B7, B56) — more than B2's 3T14 (462 mm²): check these are B3/B4 on the plans;
- top steel up to 734 mm² (F.F B81 support) — check the support bars there.

**Columns** — 154 of 155 column segments pass (next highest ratio 0.88):

- **R.F C16 (200 × 900, 16T16) fails: ratio 1.195** at the top under 1.4D + 1.7L,
  P = 210 kN with M = 89 kN·m and **92 kN·m about the 200 mm weak axis**. The same in every setting tested.
  Options: release the weak-axis end moment of the beam framing into it, change the column orientation,
  or widen it at R.F.
- **Slenderness:** δns > 1.4 (ACI 318-19 §6.2.5.3 / §6.6.4.5.1) on G.F C3, C4, C5, C13, C14, C16, C28, C29,
  C54 and F.F C17 — the 4.05 m ground storey with 200 mm columns. These need a second-order analysis or
  stiffer columns.

## 4. Other items (unchanged from the first review)

1. **Allowable bearing** is stated three ways: 1.5 kg/cm² (S-201), 1.8 kg/cm² (S-203), "B.C = 30 TON/M2"
   on the SAFE soil spring. Hand check with the SAFE column loads (D + L) and footing self-weight:
   18 of 35 isolated footings exceed 150 kPa, 14 exceed 180 kPa, highest ≈ 280 kPa (F1, 1.5 × 1.2 m);
   all pass at 300 kPa. Confirm the soil report value.
2. **Superimposed loads** below S-201: walls 9.81 kN/m vs 11.10; floor finishes 1.96 kPa vs 2.50.
3. **S-205 column schedule:** C1 table 4T14 vs detail 6Ø16 (master: 4T14); C4/C5 tie spacing differs.
4. **B1 beams** 200 × 400 on S-212 but 200 × 600 in the model.
5. **Neck columns:** 300 mm on S-207, 200 mm in the model. Ground beams: 200 (S-207 table) vs 250 (detail).
6. **Levels:** first ceiling +8.45 on S-214, +8.60 in the model; ground beams +0.55 (S-206) vs +0.65.
7. **Combinations** on S-201 differ from the model's U1–U15; SAFE uses 1.4D + 1.7L.
8. **Concrete** 30 MPa on drawings vs FC 28 in the model (conservative).

## 5. Files

Test models are in the session's temporary folder only:
`villa-copy-beamJ001.EDB` (J = 0.01) and `villa-copy-ordinary-J035.EDB` (Ordinary beams, J = 0.35).
The project folder still contains only the original master.
