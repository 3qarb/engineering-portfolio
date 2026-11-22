import { MAT, sample, type ElementType } from './types';

const beamDepth = {
  clause: 'ACI 318-19 Table 9.3.1.1',
  text: {
    en: 'Minimum depth where deflection is not calculated: ℓ/16 simply supported, ℓ/18.5 one end continuous, ℓ/21 both ends continuous, ℓ/8 cantilever.',
    ar: 'أقل عمق عند عدم حساب الترخيم: ‎ℓ/16‎ بسيطة، ‎ℓ/18.5‎ مستمرة من طرف، ‎ℓ/21‎ مستمرة من الطرفين، ‎ℓ/8‎ كابولي.',
  },
};
const beamMin = {
  clause: 'ACI 318-19 §9.6.1.2',
  text: {
    en: 'Minimum flexural steel As,min = the greater of 0.25√f′c/fy · bw·d and 1.4/fy · bw·d.',
    ar: 'أقل حديد انحناء ‎As,min‎ = الأكبر من ‎0.25√f′c/fy · bw·d‎ و ‎1.4/fy · bw·d‎.',
  },
};
const stirrupSpacing = {
  clause: 'ACI 318-19 §9.7.6.2.2',
  text: { en: 'Stirrup spacing not more than d/2 or 600 mm where shear reinforcement is required.', ar: 'تباعد الكانات لا يزيد عن ‎d/2‎ أو 600 مم حيث يلزم تسليح القص.' },
};

export const frames: ElementType[] = [
  {
    id: 'dropped-beam',
    category: 'beam',
    name: { en: 'Dropped beam', ar: 'كمرة ساقطة' },
    summary: {
      en: 'A rectangular beam deeper than the slab, projecting below it. Carries the slab to the columns.',
      ar: 'كمرة مستطيلة أعمق من البلاطة وتبرز أسفلها، تنقل أحمال البلاطة إلى الأعمدة.',
    },
    use: { en: 'Most framed buildings; spans where a hidden beam would deflect too much.', ar: 'أغلب المباني الهيكلية، والبحور التي تترخم فيها الكمرة المخفية أكثر من اللازم.' },
    recognise: {
      en: 'ETABS frame object of type Beam with a rectangular concrete section deeper than the slab.',
      ar: 'عنصر إطاري في ETABS من نوع Beam بمقطع خرساني مستطيل أعمق من البلاطة.',
    },
    checks: [beamDepth, beamMin, stirrupSpacing],
    takeoff: {
      en: 'Concrete: b × h × length (the slab over it is counted with the slab). Formwork: soffit + two sides. Rebar: top and bottom bars × length + stirrups.',
      ar: 'الخرسانة: ‎b × h‎ × الطول. الشدات: البطنية والجانبان. الحديد: الأسياخ العلوية والسفلية × الطول + الكانات.',
    },
    sample: sample('dropped-beam', 'beam', 'Dropped beam', [4, 0.6, 0.3], {
      kind: 'rc-beam',
      b: 300,
      h: 600,
      cover: 40,
      top: { n: 2, dia: 16 },
      bottom: { n: 3, dia: 16 },
      stirrups: { dia: 10, spacing: 150, legs: 2 },
      ...MAT,
    }),
  },
  {
    id: 'hidden-beam',
    category: 'beam',
    name: { en: 'Hidden beam', ar: 'كمرة مخفية' },
    summary: {
      en: 'A wide, shallow beam within the slab depth, so the ceiling stays flat. Common with hollow-block slabs.',
      ar: 'كمرة عريضة قليلة العمق ضمن عمق البلاطة فيبقى السقف مستوياً، شائعة مع بلاطات الهوردي.',
    },
    use: { en: 'Villas and apartments where dropped beams would show in the rooms.', ar: 'الفلل والشقق حيث تظهر الكمرات الساقطة داخل الغرف.' },
    recognise: {
      en: 'A solid slab strip named H.B, HB or Hidden, or a beam no deeper than the slab around it.',
      ar: 'شريحة بلاطة مصمتة باسم ‎H.B‎ أو ‎HB‎ أو ‎Hidden‎، أو كمرة لا يزيد عمقها عن البلاطة المحيطة.',
    },
    checks: [
      beamDepth,
      beamMin,
      {
        clause: 'ACI 318-19 §24.2',
        text: {
          en: 'Shallow beams are governed by deflection: check long-term deflection when the span exceeds the Table 9.3.1.1 limits.',
          ar: 'الترخيم هو الحاكم في الكمرات قليلة العمق: يُحسب الترخيم طويل المدى عند تجاوز حدود الجدول ‎9.3.1.1‎.',
        },
      },
    ],
    takeoff: {
      en: 'Concrete: b × h × length. Formwork: soffit only (formed with the slab). Rebar: bars × length + multi-leg stirrups.',
      ar: 'الخرسانة: ‎b × h‎ × الطول. الشدات: البطنية فقط (مع البلاطة). الحديد: الأسياخ × الطول + الكانات متعددة الأفرع.',
    },
    sample: sample('hidden-beam', 'beam', 'Hidden beam', [4, 0.32, 0.8], {
      kind: 'rc-beam',
      b: 800,
      h: 320,
      cover: 25,
      top: { n: 6, dia: 16 },
      bottom: { n: 6, dia: 16 },
      stirrups: { dia: 10, spacing: 150, legs: 4 },
      ...MAT,
    }),
  },
  {
    id: 'column-rect',
    category: 'vertical',
    name: { en: 'Rectangular column', ar: 'عمود مستطيل' },
    summary: {
      en: 'A tied reinforced-concrete column: longitudinal bars round the perimeter held by closed ties.',
      ar: 'عمود خرساني مسلح بكانات: أسياخ طولية على المحيط تثبتها كانات مغلقة.',
    },
    use: { en: 'Almost every framed building; long sides set into walls to hide them.', ar: 'تقريباً كل المباني الهيكلية، ويُوجّه الضلع الطويل داخل الجدران لإخفائه.' },
    recognise: {
      en: 'ETABS frame object of type Column with a rectangular concrete section; bars from the section name (e.g. COL 20X50 8T16) or its reinforcement data.',
      ar: 'عنصر إطاري في ETABS من نوع Column بمقطع مستطيل؛ والتسليح من اسم المقطع (مثل ‎COL 20X50 8T16‎) أو من بيانات تسليحه.',
    },
    checks: [
      {
        clause: 'ACI 318-19 §10.6.1.1',
        text: { en: 'Longitudinal steel between 1 % and 8 % of the gross area.', ar: 'الحديد الطولي بين 1٪ و 8٪ من المساحة الكلية.' },
      },
      {
        clause: 'ACI 318-19 §10.7.3.1',
        text: { en: 'At least four bars in rectangular or circular ties.', ar: 'أربعة أسياخ على الأقل داخل كانات مستطيلة أو دائرية.' },
      },
      {
        clause: 'ACI 318-19 §25.7.2.1',
        text: { en: 'Tie spacing not more than 16 bar diameters, 48 tie diameters or the least column dimension.', ar: 'تباعد الكانات لا يزيد عن 16 قطر سيخ أو 48 قطر كانة أو أصغر بعد للعمود.' },
      },
      {
        clause: 'ACI 318-19 §6.2.5.1',
        text: {
          en: 'Slenderness may be neglected when kℓu/r ≤ 22 (sway) or ≤ 34 + 12(M1/M2) and ≤ 40 (non-sway); r = 0.3h for rectangles.',
          ar: 'يمكن إهمال النحافة عندما ‎kℓu/r ≤ 22‎ (منشأ متحرك) أو ‎≤ 34 + 12(M1/M2)‎ وبحد أقصى 40 (غير متحرك)؛ ‎r = 0.3h‎ للمستطيل.',
        },
      },
    ],
    takeoff: {
      en: 'Concrete: b × h × storey height. Formwork: perimeter × height. Rebar: bars × height (starter lap not added) + ties.',
      ar: 'الخرسانة: ‎b × h‎ × ارتفاع الدور. الشدات: المحيط × الارتفاع. الحديد: الأسياخ × الارتفاع (بدون الوصلات) + الكانات.',
    },
    sample: sample('column-rect', 'column', 'Rectangular column', [0.3, 3.2, 0.6], {
      kind: 'rc-column',
      b: 300,
      h: 600,
      cover: 40,
      bars: { n: 10, dia: 16 },
      ties: { dia: 10, spacing: 150 },
      ...MAT,
    }),
  },
  {
    id: 'column-circle',
    category: 'vertical',
    name: { en: 'Circular column', ar: 'عمود دائري' },
    summary: {
      en: 'A round column with bars on a circle, confined by a continuous spiral or circular hoops.',
      ar: 'عمود دائري بأسياخ على دائرة يحصرها حلزون مستمر أو كانات دائرية.',
    },
    use: { en: 'Exposed columns in lobbies, car parks and façades; spirals add ductility.', ar: 'الأعمدة الظاهرة في المداخل والمواقف والواجهات؛ ويزيد الحلزون من المطيلية.' },
    recognise: { en: 'ETABS frame section of shape “Concrete Circle”.', ar: 'مقطع إطاري في ETABS من شكل ‎“Concrete Circle”‎.' },
    checks: [
      {
        clause: 'ACI 318-19 §10.6.1.1',
        text: { en: 'Longitudinal steel between 1 % and 8 % of the gross area.', ar: 'الحديد الطولي بين 1٪ و 8٪ من المساحة الكلية.' },
      },
      { clause: 'ACI 318-19 §10.7.3.1', text: { en: 'At least six bars enclosed by spirals.', ar: 'ستة أسياخ على الأقل داخل الحلزون.' } },
      {
        clause: 'ACI 318-19 §25.7.3.1',
        text: { en: 'Spiral clear spacing between 25 mm (and 4/3 of the aggregate size) and 75 mm.', ar: 'المسافة الصافية بين لفات الحلزون بين 25 مم (و ‎4/3‎ مقاس الركام) و 75 مم.' },
      },
    ],
    takeoff: {
      en: 'Concrete: π d²/4 × height. Formwork: π d × height. Rebar: bars × height + spiral length (turns × π × hoop diameter).',
      ar: 'الخرسانة: ‎π d²/4‎ × الارتفاع. الشدات: ‎π d‎ × الارتفاع. الحديد: الأسياخ × الارتفاع + طول الحلزون.',
    },
    sample: sample('column-circle', 'column', 'Circular column', [0.5, 3.2, 0.5], {
      kind: 'rc-column',
      shape: 'circle',
      b: 500,
      h: 500,
      cover: 40,
      bars: { n: 8, dia: 20 },
      ties: { dia: 10, spacing: 75 },
      ...MAT,
    }),
  },
  {
    id: 'rc-wall',
    category: 'vertical',
    name: { en: 'RC wall / shear wall', ar: 'جدار خرساني / جدار قص' },
    summary: {
      en: 'A reinforced-concrete wall with vertical and horizontal bars, in one layer or one at each face. As a shear wall it resists the lateral load.',
      ar: 'جدار خرساني مسلح بأسياخ رأسية وأفقية في طبقة واحدة أو طبقة عند كل وجه، ويقاوم الأحمال الجانبية عندما يكون جدار قص.',
    },
    use: { en: 'Cores, stair and lift shafts, basement walls, and buildings that need lateral stiffness.', ar: 'الأنوية وبيوت الدرج والمصاعد وجدران القبو، والمباني التي تحتاج إلى جساءة جانبية.' },
    recognise: { en: 'ETABS area object of type Panel with a Wall property.', ar: 'عنصر مساحي في ETABS من نوع ‎Panel‎ بخاصية ‎Wall‎.' },
    checks: [
      {
        clause: 'ACI 318-19 Table 11.3.1.1',
        text: {
          en: 'Bearing walls at least the greater of 100 mm and 1/25 of the lesser of unsupported height and length; exterior basement walls 190 mm.',
          ar: 'الجدران الحاملة لا تقل عن الأكبر من 100 مم و ‎1/25‎ من الأقل بين الارتفاع والطول غير المسنودين؛ وجدران القبو الخارجية 190 مم.',
        },
      },
      {
        clause: 'ACI 318-19 Table 11.6.1',
        text: {
          en: 'Minimum ρℓ 0.0012 and ρt 0.0020 for bars up to T16 with fy ≥ 420 (in-plane Vu ≤ 0.5φVc).',
          ar: 'أقل نسبة ‎ρℓ 0.0012‎ و ‎ρt 0.0020‎ للأسياخ حتى ‎T16‎ مع ‎fy ≥ 420‎.',
        },
      },
      {
        clause: 'ACI 318-19 §11.7.2.3',
        text: { en: 'Walls thicker than 250 mm need two layers of reinforcement.', ar: 'الجدران الأسمك من 250 مم تحتاج طبقتين من التسليح.' },
      },
      {
        clause: 'ACI 318-19 §18.10.2.1',
        text: { en: 'Special structural walls: ρℓ and ρt at least 0.0025.', ar: 'جدران القص الخاصة: ‎ρℓ‎ و ‎ρt‎ لا تقل عن ‎0.0025‎.' },
      },
    ],
    takeoff: {
      en: 'Concrete: length × height × thickness. Formwork: both faces. Rebar: both meshes × face area × number of layers.',
      ar: 'الخرسانة: الطول × الارتفاع × السماكة. الشدات: الوجهان. الحديد: الشبكتان × مساحة الوجه × عدد الطبقات.',
    },
    sample: sample('rc-wall', 'wall', 'Shear wall', [3, 3.2, 0.25], {
      kind: 'rc-wall',
      t: 250,
      cover: 30,
      vertical: { dia: 12, spacing: 200 },
      horizontal: { dia: 10, spacing: 200 },
      layers: 2,
      ...MAT,
    }),
  },
];
