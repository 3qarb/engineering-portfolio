import { MAT, sample, type ElementType } from './types';

export const slabs: ElementType[] = [
  {
    id: 'solid-slab',
    category: 'slab',
    name: { en: 'Solid slab', ar: 'بلاطة مصمتة' },
    summary: {
      en: 'A flat reinforced-concrete plate of one thickness, spanning one way between beams or two ways on beams all round.',
      ar: 'لوح خرساني مسلح بسماكة واحدة، يمتد في اتجاه واحد بين الكمرات أو في اتجاهين على كمرات من جميع الجهات.',
    },
    use: {
      en: 'Short and medium spans with beams, wet areas, roofs that carry plant, and any slab with many openings.',
      ar: 'البحور القصيرة والمتوسطة مع وجود كمرات، والمناطق الرطبة، والأسطح التي تحمل معدات، والبلاطات كثيرة الفتحات.',
    },
    recognise: {
      en: 'ETABS slab property with Slab Type “Slab” on a story that also has beams.',
      ar: 'خاصية بلاطة في ETABS من نوع ‎“Slab”‎ في دور توجد به كمرات.',
    },
    checks: [
      {
        clause: 'ACI 318-19 Table 7.3.1.1',
        text: {
          en: 'One-way slab minimum thickness: ℓ/20 simply supported, ℓ/24 one end continuous, ℓ/28 both ends continuous, ℓ/10 cantilever (fy 420, normal-weight concrete).',
          ar: 'أقل سماكة للبلاطة ذات الاتجاه الواحد: ℓ/20 بسيطة الارتكاز، ℓ/24 مستمرة من طرف، ℓ/28 مستمرة من الطرفين، ℓ/10 كابولي.',
        },
      },
      {
        clause: 'ACI 318-19 §7.6.1.1, §24.4.3.2',
        text: { en: 'Minimum reinforcement 0.0018 Ag for Grade 420 deformed bars.', ar: 'أقل تسليح ‎0.0018 Ag‎ لحديد رتبة 420.' },
      },
      {
        clause: 'ACI 318-19 §7.7.2.3',
        text: { en: 'Bar spacing not more than the lesser of 3h and 450 mm.', ar: 'تباعد الأسياخ لا يزيد عن الأقل من ‎3h‎ و 450 مم.' },
      },
    ],
    takeoff: {
      en: 'Concrete: plan area × thickness. Formwork: soffit area. Rebar: each mesh × plan area, both directions.',
      ar: 'الخرسانة: المساحة × السماكة. الشدات: مساحة البطنية. الحديد: كل شبكة × المساحة في الاتجاهين.',
    },
    sample: sample('solid-slab', 'slab', 'Solid slab', [3, 0.2, 2.4], {
      kind: 'rc-slab',
      t: 200,
      cover: 20,
      bottom: { dia: 12, spacing: 200 },
      top: { dia: 10, spacing: 200 },
      ...MAT,
    }),
  },
  {
    id: 'flat-slab',
    category: 'slab',
    name: { en: 'Flat slab with drop panel', ar: 'بلاطة مسطحة (فلات سلاب) مع سقوط' },
    summary: {
      en: 'A two-way slab carried directly on columns, without beams. A thicker drop panel at each column takes the punching shear and the hogging moment.',
      ar: 'بلاطة باتجاهين ترتكز مباشرة على الأعمدة دون كمرات، مع سقوط (دروب) أسمك عند كل عمود لمقاومة القص الثاقب والعزم السالب.',
    },
    use: {
      en: 'Regular column grids where a flat soffit and low storey height matter: car parks, offices, residential towers.',
      ar: 'شبكات الأعمدة المنتظمة حيث يهم السقف المستوي وقلة ارتفاع الدور: المواقف والمكاتب والأبراج السكنية.',
    },
    recognise: {
      en: 'A solid slab on a story with no beams; ETABS slab property type “Drop” for the drop panels.',
      ar: 'بلاطة مصمتة في دور بلا كمرات؛ وخاصية ‎“Drop”‎ في ETABS للسقوط.',
    },
    checks: [
      {
        clause: 'ACI 318-19 Table 8.3.1.1',
        text: {
          en: 'Minimum thickness without drop panels ℓn/33 (interior), with drop panels ℓn/36; never less than 125 mm without drops or 100 mm with drops.',
          ar: 'أقل سماكة بدون سقوط ‎ℓn/33‎ (البواكي الداخلية) ومع السقوط ‎ℓn/36‎؛ ولا تقل عن 125 مم بدون سقوط أو 100 مم مع السقوط.',
        },
      },
      {
        clause: 'ACI 318-19 §8.2.4',
        text: {
          en: 'A drop panel projects below the slab at least ¼ of the slab thickness and extends at least ℓ/6 each way from the column centreline.',
          ar: 'يبرز السقوط أسفل البلاطة بما لا يقل عن ربع سماكتها ويمتد ‎ℓ/6‎ على الأقل في كل اتجاه من محور العمود.',
        },
      },
      {
        clause: 'ACI 318-19 §22.6',
        text: { en: 'Punching (two-way) shear on the critical perimeter d/2 from the column face and from the drop edge.', ar: 'القص الثاقب على المحيط الحرج على بعد ‎d/2‎ من وجه العمود ومن حافة السقوط.' },
      },
      {
        clause: 'ACI 318-19 §8.7.4.2',
        text: { en: 'Structural integrity: at least two bottom bars each way pass through the column core.', ar: 'سلامة المنشأ: سيخان سفليان على الأقل في كل اتجاه يمران داخل قلب العمود.' },
      },
    ],
    takeoff: {
      en: 'Concrete: slab area × thickness + drop panel volume. Formwork: soffit including the drop sides. Rebar: bottom and top meshes, both ways.',
      ar: 'الخرسانة: المساحة × السماكة + حجم السقوط. الشدات: البطنية مع جوانب السقوط. الحديد: الشبكتان السفلية والعلوية في الاتجاهين.',
    },
    sample: sample(
      'flat-slab',
      'slab',
      'Flat slab panel',
      [4, 0.25, 4],
      { kind: 'rc-slab', t: 250, cover: 25, bottom: { dia: 12, spacing: 150 }, top: { dia: 12, spacing: 150 }, drop: { t: 150, size: 1600 }, ...MAT },
      { position: [0, 0.15 + 0.125, 0] },
    ),
  },
  {
    id: 'ribbed-slab',
    category: 'slab',
    name: { en: 'Ribbed slab (hollow block)', ar: 'بلاطة هوردي (بلوك مفرغ)' },
    summary: {
      en: 'One-way ribs at close centres under a thin topping. Hollow blocks fill the space between the ribs and stay in place, so the soffit is flat.',
      ar: 'أعصاب في اتجاه واحد على مسافات متقاربة تحت طبقة علوية رقيقة، ويملأ البلوك المفرغ الفراغ بين الأعصاب ويبقى مكانه فيصبح السقف مستوياً.',
    },
    use: {
      en: 'Residential and villa floors in the Gulf: light for its depth, quick to form, and the blocks insulate the roof.',
      ar: 'أسقف المباني السكنية والفلل في الخليج: خفيفة بالنسبة لعمقها وسريعة التنفيذ، والبلوك يعزل السطح.',
    },
    recognise: {
      en: 'ETABS slab property with Slab Type “Ribbed”; rib direction from “ribs parallel to local axis”. Hidden beams are the solid strips at the slab depth.',
      ar: 'خاصية بلاطة في ETABS من نوع ‎“Ribbed”‎؛ واتجاه الأعصاب من خيار ‎“ribs parallel to local axis”‎. والكمرات المخفية هي الشرائح المصمتة بعمق البلاطة.',
    },
    checks: [
      {
        clause: 'ACI 318-19 §9.8.1.2',
        text: { en: 'Ribs at least 100 mm wide at every point of their depth.', ar: 'عرض العصب لا يقل عن 100 مم على كامل عمقه.' },
      },
      {
        clause: 'ACI 318-19 §9.8.1.3',
        text: { en: 'Overall rib depth not more than 3.5 × the minimum rib width.', ar: 'عمق العصب الكلي لا يزيد عن ‎3.5‎ ضعف أقل عرض للعصب.' },
      },
      {
        clause: 'ACI 318-19 §9.8.1.4',
        text: { en: 'Clear spacing between ribs not more than 750 mm.', ar: 'المسافة الصافية بين الأعصاب لا تزيد عن 750 مم.' },
      },
      {
        clause: 'ACI 318-19 §9.8.2.1.1',
        text: {
          en: 'Topping over permanent fillers at least the greater of 1/12 of the clear rib spacing and 40 mm.',
          ar: 'سماكة الطبقة العلوية فوق البلوك الدائم لا تقل عن الأكبر من ‎1/12‎ المسافة الصافية بين الأعصاب و 40 مم.',
        },
      },
      {
        clause: 'ACI 318-19 Table 9.3.1.1',
        text: { en: 'Rib depth against the span as for beams: ℓ/16, ℓ/18.5, ℓ/21, ℓ/8.', ar: 'عمق العصب مقابل البحر كما في الكمرات: ‎ℓ/16‎، ‎ℓ/18.5‎، ‎ℓ/21‎، ‎ℓ/8‎.' },
      },
    ],
    takeoff: {
      en: 'Concrete: area × equivalent thickness (topping + rib stems). Formwork: soffit area. Blocks: count from rib spacing and block length. Rebar: rib bars × number of ribs × length, links, topping mesh.',
      ar: 'الخرسانة: المساحة × السماكة المكافئة (الطبقة العلوية + الأعصاب). الشدات: مساحة البطنية. البلوك: العدد من تباعد الأعصاب وطول البلوكة. الحديد: أسياخ الأعصاب × عددها × الطول، والكانات، وشبكة الطبقة العلوية.',
    },
    sample: sample('ribbed-slab', 'slab', 'Hollow-block slab panel', [2.4, 0.32, 1.65], {
      kind: 'ribbed-slab',
      depth: 320,
      topping: 70,
      ribWidth: 150,
      ribSpacing: 550,
      ribAxis: 'x',
      ribBars: { top: { n: 1, dia: 12 }, bottom: { n: 2, dia: 12 } },
      ribLinks: { dia: 8, spacing: 200 },
      filler: 'block',
      toppingMesh: { dia: 8, spacing: 250 },
      cover: 20,
      ...MAT,
    }),
  },
  {
    id: 'waffle-slab',
    category: 'slab',
    name: { en: 'Waffle slab (two-way ribs)', ar: 'بلاطة وافل (أعصاب في اتجاهين)' },
    summary: {
      en: 'Ribs both ways under a topping, cast over removable void formers. Solid heads are left over the columns.',
      ar: 'أعصاب في الاتجاهين تحت طبقة علوية، تصب فوق قوالب فراغ تُزال بعد الصب، مع رؤوس مصمتة فوق الأعمدة.',
    },
    use: {
      en: 'Long two-way spans with heavy loads where a solid slab would be too heavy: halls, podiums, public buildings.',
      ar: 'البحور الطويلة باتجاهين والأحمال الكبيرة حيث تكون البلاطة المصمتة ثقيلة: القاعات والمنصات والمباني العامة.',
    },
    recognise: { en: 'ETABS slab property with Slab Type “Waffle”.', ar: 'خاصية بلاطة في ETABS من نوع ‎“Waffle”‎.' },
    checks: [
      {
        clause: 'ACI 318-19 §8.8.1',
        text: {
          en: 'Two-way joist limits: ribs ≥ 100 mm wide, depth ≤ 3.5 × rib width, clear spacing ≤ 750 mm.',
          ar: 'حدود الأعصاب باتجاهين: العرض ≥ 100 مم، والعمق ≤ ‎3.5‎ ضعف العرض، والمسافة الصافية ≤ 750 مم.',
        },
      },
      {
        clause: 'ACI 318-19 §8.8, §9.8.3.1',
        text: {
          en: 'Topping over removable forms at least the greater of 1/12 of the clear rib spacing and 50 mm.',
          ar: 'سماكة الطبقة العلوية فوق القوالب المزالة لا تقل عن الأكبر من ‎1/12‎ المسافة الصافية و 50 مم.',
        },
      },
      {
        clause: 'ACI 318-19 §22.6',
        text: { en: 'Punching shear at the solid heads over the columns.', ar: 'القص الثاقب عند الرؤوس المصمتة فوق الأعمدة.' },
      },
    ],
    takeoff: {
      en: 'Concrete: area × equivalent thickness (topping + both rib sets, crossings counted once). Formwork: soffit area with the void formers. Rebar: rib bars both ways, links, topping mesh.',
      ar: 'الخرسانة: المساحة × السماكة المكافئة (الطبقة العلوية + الأعصاب في الاتجاهين مع حساب التقاطع مرة واحدة). الشدات: البطنية مع قوالب الفراغ. الحديد: أسياخ الأعصاب في الاتجاهين والكانات وشبكة الطبقة العلوية.',
    },
    sample: sample('waffle-slab', 'slab', 'Waffle slab panel', [2.7, 0.4, 2.7], {
      kind: 'ribbed-slab',
      depth: 400,
      topping: 100,
      ribWidth: 150,
      ribSpacing: 900,
      ribAxis: 'both',
      ribBars: { top: { n: 1, dia: 12 }, bottom: { n: 2, dia: 16 } },
      ribLinks: { dia: 8, spacing: 250 },
      filler: 'void',
      toppingMesh: { dia: 8, spacing: 200 },
      cover: 25,
      ...MAT,
    }),
  },
];
