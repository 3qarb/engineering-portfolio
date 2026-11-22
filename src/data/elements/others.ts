import { MAT, sample, type ElementType } from './types';

const footingDepth = {
  clause: 'ACI 318-19 §13.3.1.2',
  text: { en: 'Depth above the bottom reinforcement at least 150 mm.', ar: 'العمق فوق حديد التسليح السفلي لا يقل عن 150 مم.' },
};
const groundCover = {
  clause: 'ACI 318-19 Table 20.5.1.3.1',
  text: { en: 'Concrete cast against and permanently in contact with the ground: 75 mm cover.', ar: 'الخرسانة المصبوبة على التربة مباشرة: غطاء 75 مم.' },
};
const bearing = {
  clause: 'Geotechnical report',
  text: {
    en: 'Soil pressure under service loads not more than the allowable bearing value given by the soil investigation.',
    ar: 'ضغط التربة تحت أحمال التشغيل لا يزيد عن قدرة التحمل المسموحة في تقرير التربة.',
  },
};

export const others: ElementType[] = [
  {
    id: 'stair',
    category: 'stair-ramp',
    name: { en: 'Stair flight', ar: 'شاحط درج' },
    summary: {
      en: 'An inclined waist slab with the steps cast on it, spanning between landings or beams.',
      ar: 'بلاطة مائلة (الوسط) تصب عليها الدرجات، تمتد بين البسطات أو الكمرات.',
    },
    use: { en: 'Every multi-storey building; the waist is designed as a one-way slab on its horizontal span.', ar: 'كل مبنى متعدد الأدوار؛ ويُصمم الوسط كبلاطة باتجاه واحد على بحره الأفقي.' },
    recognise: {
      en: 'An inclined floor or ramp area steeper than 25 %, or any area whose property name contains STAIR.',
      ar: 'مساحة مائلة أشد من 25٪، أو أي مساحة يحتوي اسم خاصيتها على ‎STAIR‎.',
    },
    checks: [
      {
        clause: 'SBC 201 / IBC §1011.5.2',
        text: {
          en: 'Risers 102–178 mm and treads at least 279 mm; inside dwelling units risers up to 196 mm and treads at least 254 mm.',
          ar: 'القائمة بين 102 و 178 مم والنائمة لا تقل عن 279 مم؛ وداخل الوحدات السكنية القائمة حتى 196 مم والنائمة لا تقل عن 254 مم.',
        },
      },
      {
        clause: 'ACI 318-19 Table 7.3.1.1',
        text: { en: 'Waist thickness against the horizontal span as for one-way slabs.', ar: 'سماكة الوسط مقابل البحر الأفقي كما في البلاطات باتجاه واحد.' },
      },
      {
        clause: '2R + T rule',
        basis: 'guidance',
        text: { en: 'Comfortable going when twice the riser plus the tread is about 600–650 mm.', ar: 'تكون الدرجة مريحة عندما يكون ضعف القائمة مع النائمة نحو 600–650 مم.' },
      },
    ],
    takeoff: {
      en: 'Concrete: sloped length × width × waist + the step triangles. Formwork: soffit + risers. Rebar: main bars along the flight + distribution bars across it.',
      ar: 'الخرسانة: الطول المائل × العرض × الوسط + مثلثات الدرج. الشدات: البطنية + القوائم. الحديد: الأسياخ الرئيسية على طول الشاحط + أسياخ التوزيع بعرضه.',
    },
    sample: sample('stair', 'stair', 'Stair flight', [2.8, 1.7 + 0.16 / (2.8 / Math.hypot(2.8, 1.7)), 1.2], {
      kind: 'stair',
      waist: 160,
      riser: 170,
      tread: 280,
      steps: 10,
      width: 1200,
      cover: 25,
      main: { dia: 12, spacing: 150 },
      distribution: { dia: 10, spacing: 200 },
      ...MAT,
    }),
  },
  {
    id: 'ramp',
    category: 'stair-ramp',
    name: { en: 'Ramp', ar: 'منحدر (رامب)' },
    summary: {
      en: 'An inclined solid slab for vehicles or people, spanning between beams, walls or the ground.',
      ar: 'بلاطة مصمتة مائلة للسيارات أو المشاة، تمتد بين الكمرات أو الجدران أو على التربة.',
    },
    use: { en: 'Basement car parks, loading docks and accessible entrances.', ar: 'مواقف القبو ومناطق التحميل والمداخل الميسرة.' },
    recognise: { en: 'ETABS area object of type Ramp, or an inclined floor area up to 25 % slope.', ar: 'عنصر مساحي في ETABS من نوع ‎Ramp‎، أو مساحة مائلة حتى ميل 25٪.' },
    checks: [
      {
        clause: 'SBC 201 / IBC §1012.2',
        text: { en: 'Pedestrian ramps on a means of egress: slope not steeper than 1:12 (8.33 %).', ar: 'منحدرات المشاة في مسارات الخروج: الميل لا يزيد عن ‎1:12‎ (‏8.33٪).' },
      },
      {
        clause: 'Parking design',
        basis: 'guidance',
        text: {
          en: 'Vehicle ramps are usually kept to about 15 % or less, with gentler transition lengths at the top and bottom.',
          ar: 'تُحدد منحدرات السيارات عادة بنحو 15٪ أو أقل، مع أطوال انتقالية أخف عند البداية والنهاية.',
        },
      },
      {
        clause: 'ACI 318-19 Table 7.3.1.1',
        text: { en: 'Thickness against the span as for one-way slabs.', ar: 'السماكة مقابل البحر كما في البلاطات باتجاه واحد.' },
      },
    ],
    takeoff: {
      en: 'Concrete: sloped area × thickness. Formwork: sloped soffit. Rebar: bottom and top meshes, both ways.',
      ar: 'الخرسانة: المساحة المائلة × السماكة. الشدات: البطنية المائلة. الحديد: الشبكتان في الاتجاهين.',
    },
    sample: sample(
      'ramp',
      'ramp',
      'Ramp',
      [Math.hypot(6, 0.72), 0.2, 3],
      { kind: 'ramp', t: 200, slope: 12, cover: 30, bottom: { dia: 12, spacing: 200 }, top: { dia: 12, spacing: 200 }, ...MAT },
      { position: [0, 0.46, 0], rotation: [0, 0, Math.atan(0.12)] },
    ),
  },
  {
    id: 'ground-beam',
    category: 'foundation',
    name: { en: 'Ground beam (tie beam)', ar: 'ميدة (كمرة أرضية)' },
    summary: {
      en: 'A beam at foundation level that ties the footings together and carries the ground-floor walls.',
      ar: 'كمرة بمنسوب الأساسات تربط القواعد معاً وتحمل جدران الدور الأرضي.',
    },
    use: { en: 'Between isolated footings, especially on weak or variable soil and in seismic zones.', ar: 'بين القواعد المنفصلة، خاصة في التربة الضعيفة أو المتغيرة وفي المناطق الزلزالية.' },
    recognise: { en: 'Beams on the lowest story (G.B, Ground Beam, Tie) of the ETABS model.', ar: 'الكمرات في أدنى دور بنموذج ETABS ‏(G.B أو Ground Beam أو Tie).' },
    checks: [
      {
        clause: 'ACI 318-19 §18.13.3',
        text: { en: 'In seismic design, grade beams acting as ties between footings are designed for the tie force.', ar: 'في التصميم الزلزالي تُصمم الميدات التي تربط القواعد لقوة الربط.' },
      },
      beamMinGround(),
      groundCover,
    ],
    takeoff: {
      en: 'Concrete: b × h × length. Formwork: two sides (soffit on blinding). Rebar: bars × length + stirrups.',
      ar: 'الخرسانة: ‎b × h‎ × الطول. الشدات: الجانبان (البطنية على خرسانة النظافة). الحديد: الأسياخ × الطول + الكانات.',
    },
    sample: sample('ground-beam', 'beam', 'Ground beam', [4, 0.6, 0.3], {
      kind: 'rc-beam',
      b: 300,
      h: 600,
      cover: 50,
      top: { n: 3, dia: 16 },
      bottom: { n: 3, dia: 16 },
      stirrups: { dia: 10, spacing: 200, legs: 2 },
      ...MAT,
    }),
  },
  {
    id: 'isolated-footing',
    category: 'foundation',
    name: { en: 'Isolated footing', ar: 'قاعدة منفصلة' },
    summary: { en: 'A square or rectangular pad under one column, spreading its load to the soil.', ar: 'قاعدة مربعة أو مستطيلة تحت عمود واحد توزع حمله على التربة.' },
    use: { en: 'Columns on good soil with moderate loads.', ar: 'الأعمدة على تربة جيدة بأحمال متوسطة.' },
    recognise: { en: 'SAFE area of property type Footing under a single column.', ar: 'مساحة في SAFE من نوع ‎Footing‎ تحت عمود واحد.' },
    checks: [
      footingDepth,
      groundCover,
      {
        clause: 'ACI 318-19 §22.6, §22.5',
        text: { en: 'Punching shear at d/2 from the column face, and one-way shear at d from it.', ar: 'القص الثاقب على بعد ‎d/2‎ من وجه العمود، والقص باتجاه واحد على بعد ‎d‎ منه.' },
      },
      bearing,
    ],
    takeoff: {
      en: 'Concrete: length × width × depth. Formwork: perimeter × depth. Rebar: bottom mesh both ways (and top mesh where used).',
      ar: 'الخرسانة: الطول × العرض × العمق. الشدات: المحيط × العمق. الحديد: الشبكة السفلية في الاتجاهين (والعلوية إن وجدت).',
    },
    sample: sample('isolated-footing', 'footing', 'Isolated footing', [2.2, 0.6, 2.2], {
      kind: 'rc-footing',
      l: 2200,
      b: 2200,
      t: 600,
      cover: 75,
      bottom: { dia: 16, spacing: 150 },
      ...MAT,
    }),
  },
  {
    id: 'strip-footing',
    category: 'foundation',
    name: { en: 'Strip footing', ar: 'قاعدة شريطية' },
    summary: { en: 'A continuous footing under a wall or a line of closely spaced columns.', ar: 'قاعدة مستمرة تحت جدار أو صف أعمدة متقاربة.' },
    use: { en: 'Load-bearing walls, retaining walls and boundary walls.', ar: 'الجدران الحاملة والساندة وجدران السور.' },
    recognise: { en: 'SAFE footing drawn as a long strip, or as an outline with a hole along a wall.', ar: 'قاعدة في SAFE مرسومة كشريط طويل أو كحدود بفتحة على امتداد جدار.' },
    checks: [footingDepth, groundCover, bearing],
    takeoff: {
      en: 'Concrete: length × width × depth. Formwork: two long sides and the ends. Rebar: transverse main bars + longitudinal distribution bars.',
      ar: 'الخرسانة: الطول × العرض × العمق. الشدات: الجانبان والطرفان. الحديد: الأسياخ العرضية الرئيسية + أسياخ التوزيع الطولية.',
    },
    sample: sample('strip-footing', 'footing', 'Strip footing', [4, 0.5, 1.2], {
      kind: 'rc-footing',
      l: 4000,
      b: 1200,
      t: 500,
      cover: 75,
      bottom: { dia: 14, spacing: 150 },
      ...MAT,
    }),
  },
  {
    id: 'strap-beam',
    category: 'foundation',
    name: { en: 'Strap beam', ar: 'كمرة شداد (ستراب)' },
    summary: {
      en: 'A stiff beam linking an eccentric edge footing to an interior one, so the edge footing does not tip.',
      ar: 'كمرة جاسئة تربط قاعدة طرفية لامركزية بقاعدة داخلية حتى لا تدور القاعدة الطرفية.',
    },
    use: { en: 'Columns on the plot boundary where the footing cannot extend past the property line.', ar: 'الأعمدة على حد الأرض حيث لا يمكن أن تتجاوز القاعدة حد الملكية.' },
    recognise: { en: 'SAFE beam objects at foundation level between footings.', ar: 'كمرات في SAFE بمنسوب الأساسات بين القواعد.' },
    checks: [
      {
        clause: 'Design basis',
        basis: 'guidance',
        text: {
          en: 'Designed for the moment from the edge-column eccentricity; kept off the soil so it does not take bearing.',
          ar: 'تُصمم للعزم الناتج عن لامركزية العمود الطرفي، وتُفصل عن التربة حتى لا تتحمل ضغطاً.',
        },
      },
      groundCover,
    ],
    takeoff: {
      en: 'Concrete: b × h × length. Formwork: two sides. Rebar: top bars (tension) + bottom bars + stirrups.',
      ar: 'الخرسانة: ‎b × h‎ × الطول. الشدات: الجانبان. الحديد: الأسياخ العلوية (شد) + السفلية + الكانات.',
    },
    sample: sample('strap-beam', 'beam', 'Strap beam', [3.5, 0.7, 0.4], {
      kind: 'rc-beam',
      b: 400,
      h: 700,
      cover: 50,
      top: { n: 4, dia: 16 },
      bottom: { n: 2, dia: 16 },
      stirrups: { dia: 10, spacing: 167, legs: 2 },
      ...MAT,
    }),
  },
  {
    id: 'raft',
    category: 'foundation',
    name: { en: 'Raft (mat) foundation', ar: 'لبشة (أساس حصيري)' },
    summary: { en: 'One thick slab under the whole building, with a mesh at the bottom and the top.', ar: 'بلاطة سميكة واحدة تحت كامل المبنى بشبكة سفلية وعلوية.' },
    use: { en: 'Weak soil, heavy loads, or where isolated footings would cover most of the plan.', ar: 'التربة الضعيفة والأحمال الكبيرة، أو عندما تغطي القواعد المنفصلة أغلب المسقط.' },
    recognise: { en: 'SAFE or ETABS slab property of type Mat, or a footing covering most of the footprint.', ar: 'خاصية بلاطة من نوع ‎Mat‎ في SAFE أو ETABS، أو قاعدة تغطي أغلب المسقط.' },
    checks: [
      {
        clause: 'ACI 318-19 §13.3.4',
        text: { en: 'Combined footings and mats: analysed for the soil pressure distribution and the column loads.', ar: 'القواعد المشتركة واللبشات: تحلل لتوزيع ضغط التربة وأحمال الأعمدة.' },
      },
      footingDepth,
      groundCover,
      {
        clause: 'ACI 318-19 §22.6',
        text: { en: 'Punching shear around each column.', ar: 'القص الثاقب حول كل عمود.' },
      },
      bearing,
    ],
    takeoff: {
      en: 'Concrete: area × thickness. Formwork: edge perimeter × thickness. Rebar: bottom and top meshes, both ways.',
      ar: 'الخرسانة: المساحة × السماكة. الشدات: محيط الحافة × السماكة. الحديد: الشبكتان السفلية والعلوية في الاتجاهين.',
    },
    sample: sample('raft', 'footing', 'Raft strip', [5, 0.8, 3], {
      kind: 'rc-footing',
      l: 5000,
      b: 3000,
      t: 800,
      cover: 75,
      bottom: { dia: 20, spacing: 200 },
      top: { dia: 16, spacing: 200 },
      ...MAT,
    }),
  },
];

function beamMinGround() {
  return {
    clause: 'ACI 318-19 §9.6.1.2',
    text: { en: 'Minimum flexural steel as for beams.', ar: 'أقل حديد انحناء كما في الكمرات.' },
  };
}
