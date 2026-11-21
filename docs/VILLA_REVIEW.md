# Villa project — consistency review

Reviewed 2026-11-21 from `Desktop/Etabs/Villa Project`:
19 structural sheets (S-201 to S-219, files A1–A19.pdf), `Model Report.pdf` (ETABS v20.3, 12 Sep 2026,
426 pages), ETABS text files `VILLA_Master File- claude*.$et` (ETABS 22.7, 19 Nov 2026) and the SAFE
foundation model `Main Foundation 1.$sf`. The binary `VILLA_Master File.EDB` could not be read
(ETABS was not running).

This is a document-consistency check by comparison of the files, plus one hand check of bearing
pressure. It is not a substitute for an independent design check.

## What is consistent

- Geometry: all 173 joints, 97 beam bays and 56 column lines are identical in the report model and the
  November ETABS files; member counts per story match (columns 56 / 56 / 26 / 17, beams 79 / 72 / 42 / 25).
- Report model and drawings agree on member widths: columns 200 × 400–900, beams 200 × 600.
- Seismic base shear in the report (14.0 t) ≈ 0.01 × W (dead 1,418 t), matching the S-201 note
  "seismic design category A, F = 0.01 W".
- Story drifts are small: largest 0.0008 (wind, G.F), about h/1,230.
- Live load 2.0 kN/m² matches S-201.

## Items to resolve — ranked

1. **Which ETABS model is current?** The November files (`claude`, `claude1`) use **300 mm** wide
   columns and **250 mm** beams, a different mix of column sizes (more 300 × 400), seismic coefficient
   0.0625 and ASCE 7 combinations. `claude12` changes ground beams to 300 × 600 / 300 × 800. The issued
   drawings and the September report use 200 mm members. Decide which is the design of record; if the
   wider members are needed, the drawings must be revised.
2. **Allowable bearing pressure is stated three ways.** S-201: 1.5 kg/cm² (150 kPa). S-203 note: 1.8 kg/cm².
   SAFE soil spring: "B.C = 30 TON/M2" with subgrade modulus 35 MN/m³ (consistent with ≈ 300 kPa).
   Hand check (SAFE column loads D + L, footing self-weight, over footing area):
   18 of 35 isolated footings exceed 150 kPa, 14 exceed 180 kPa, the highest ≈ 280 kPa (F1, 1.5 × 1.2 m,
   one 200 × 500 column). All pass at 300 kPa. Confirm the value in the soil report; if it is 1.5 kg/cm²,
   F1/F2/F3 need enlarging. SAFE soil-pressure output should be checked against the confirmed value.
3. **Superimposed loads in the model are below the S-201 criteria.** Walls: 9.81 kN/m (1.0 t/m) in the model
   vs 11.10 kN/m on S-201 (−12 %). Floor finishes on solid slabs: 1.96 kPa vs 2.50 kPa (−22 %); external
   floors on S-201 are 3.50 kPa. Hollow-block areas (3.92 kPa) cover 2.50 + 1.20.
4. **Column schedule S-205 contradicts itself.** C1: table 4T14, section detail 6Ø16 (report model: 4T14).
   C4 ties: table 6T10/m, detail 6Ø8/m. C5 ties: table 5T10/m, detail 6Ø10/m.
5. **B1 beams** are 200 × 400 in the S-212 schedule (perimeter beams on S-210) but every beam in the model is
   200 × 600 (one 200 × 800). The model is stiffer than the drawn B1.
6. **Neck columns.** S-207 says columns are 300 mm wide below the ground beams; the report models the G.B
   storey columns as 200 mm. Ground beams: S-207 schedule 200 wide, S-207 detail 250.
7. **Levels.** First ceiling S-214 is +8.45; model F.F is +8.60 (G.F 4.70 + 3.90). Ground beams S-206 +0.55;
   model G.B +0.65.
8. **Load combinations differ between documents.** S-201 lists 1.4D + 1.7L, 1.2D + 1.0L ± 1.0W,
   1.233D + 1.0L ± 1.0E, 0.867D ± 1.0E; the report uses 1.4D, 1.4D + 1.7L, 1.2D + 0.5L, 1.2D + W + 0.5L…;
   SAFE uses 1.4D + 1.7L. Use one set and state it on S-201.
9. **Concrete strength.** Drawings 30 MPa; models FC 28 (27.5 MPa). Conservative, but state it.
10. **Dynamic behaviour (for information).** First mode T = 1.28 s with only 27 % X-mass participation;
    35 modes reach 90 % in X. A long, local first mode in a 3-storey villa points to a flexible zone
    (slender 200 × 400 columns over the 4.05 m ground storey, or the roof annex). Worth a look even though
    the design uses equivalent static loads.
11. **Model housekeeping (November files).** Tie-leg counts larger than the bars on a face in
    `COL 30X40 H/V 6T16` (4 legs on a 2-bar face); unused default sections (SteelCol, ConcCol, Deck1, Wall1);
    two null lines and one null area at G.F/F.F; SAFE rebar material is CSA-G30.18 (template leftover).

## Not checked

Member design ratios (the report contains analysis results only), slab and stair design, punching,
detailing lengths, and anything that needs the binary EDB or SAFE result files.

## What the portfolio shows

The 3D model, plans and section use the **report model** (issued, 200 mm members) with reinforcement from
the drawings. Typical types are labelled as such (beams B2, ground beams GB1, ribs R1). Until items 1–4 are
settled, consider leaving the drawing sheets out of the public gallery (`gallery` in `src/data/projects.ts`).
