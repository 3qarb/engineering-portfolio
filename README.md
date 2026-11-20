# Abdulaziz Ahmed Kanaan — Civil & Structural Engineer Portfolio

A premium, production-quality personal portfolio website for a Civil and Structural Engineer specializing in technical office engineering, structural analysis, and heritage restoration.

## 🌟 Features

- **Premium Design**: Swiss minimalist aesthetic with editorial typography, architectural grey color palette, and muted bronze accents
- **3D Hero Visualization**: Interactive Three.js structural frame animation with auto-rotation and orbit controls
- **Responsive Layout**: Mobile-first, fully responsive across 320px - 1440px+
- **Accessible**: WCAG 2.1 AA compliant with proper ARIA labels, skip links, focus management, and reduced-motion support
- **Performance Optimized**: Code-split chunks, lazy-loaded images, optimized Three.js rendering
- **Smooth Animations**: Framer Motion powered transitions with reduced-motion support
- **SEO Ready**: Semantic HTML, Open Graph tags, structured metadata

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3.4 |
| Animation | Framer Motion 11 |
| 3D Graphics | Three.js + OrbitControls |
| Icons | Lucide React + Custom Brand Icons |
| Routing | React Router DOM 7 |
| Dev Tools | ESLint, TypeScript, Vite |

## 📁 Project Structure

```
portfolio/
├── public/
│   ├── images/              # Project images & placeholders
│   ├── cv.pdf               # Downloadable CV
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/              # Base UI components (Button, Card, Input, BrandIcons)
│   │   ├── layout/          # Header, Footer, MainLayout
│   │   ├── hero/            # Hero section with 3D visualization
│   │   ├── about/           # About preview & full page
│   │   ├── experience/      # Experience timeline
│   │   ├── projects/        # Project cards & case study pages
│   │   ├── skills/          # Skills visualization
│   │   ├── gallery/         # Engineering gallery with lightbox
│   │   └── contact/         # Contact form & info
│   ├── pages/               # Route pages (Index, About, Experience, Projects, ProjectDetail, Skills, Gallery, Contact, NotFound)
│   ├── data/                # Structured content (profile, experience, projects, skills, gallery)
│   ├── hooks/               # Custom hooks (useReducedMotion, useScrollReveal, useViewTransition)
│   ├── utils/               # Utilities (cn, animations, formatting, images, motion)
│   ├── styles/              # Global styles (index.css with design tokens)
│   ├── App.tsx              # App router setup
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts
├── .claude/launch.json      # Dev server config for Claude Browser
├── index.html               # HTML template with SEO meta
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts           # Vite config with chunk splitting
├── tailwind.config.js       # Tailwind config with design tokens
├── postcss.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
cd portfolio
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
```

Output: `dist/` directory ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## 🌐 Deployment

### Static Hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages)

The `dist/` folder contains a complete static site. Deploy it to any static hosting platform:

**Vercel:**
```bash
npx vercel --prod
```

**Netlify:**
```bash
npx netlify deploy --prod --dir=dist
```

**GitHub Pages:**
```bash
npm run build
npx gh-pages -d dist
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📝 Content Management

All portfolio content is stored in structured TypeScript files in `src/data/`. Update these files to modify content without touching components:

### Profile (`src/data/profile.ts`)
```typescript
export const profile = {
  name: 'Abdulaziz Ahmed Kanaan',
  title: 'Civil Engineer | Technical Office Engineer | Structural Engineer',
  headline: 'Engineering Precision. Structural Integrity. Heritage Preservation.',
  introduction: '...',
  location: 'Jeddah, Saudi Arabia',
  email: 'your@email.com',
  phone: '+966 50 000 0000',
  linkedin: 'https://linkedin.com/in/yourprofile',
  github: 'https://github.com/yourprofile',
  cvUrl: '/cv.pdf',
  currentCompany: { ... },
  about: { ... }
};
```

### Experience (`src/data/experience.ts`)
```typescript
export const experience: ExperienceEntry[] = [
  {
    id: 'unique-id',
    company: 'Company Name',
    position: 'Your Position',
    location: 'City, Country',
    startDate: '2022',
    endDate: 'Present', // or '2024'
    current: true,
    project: 'Project Name',
    client: 'Client Name',
    responsibilities: [
      'Responsibility 1',
      'Responsibility 2',
    ],
    technologies: ['AutoCAD', 'ETABS', 'SAP2000'],
  },
  // Add more entries...
];
```

### Projects (`src/data/projects.ts`)
```typescript
export const projects: ProjectEntry[] = [
  {
    id: 'unique-id',
    slug: 'project-slug',
    title: 'Full Project Title',
    shortTitle: 'Short Title',
    category: 'Category Name',
    location: 'City, Country',
    client: 'Client Name',
    period: '2022 – Present',
    status: 'in-progress',
    thumbnail: '/images/projects/your-project/thumbnail.jpg',
    images: [
      '/images/projects/your-project/01.jpg',
      '/images/projects/your-project/02.jpg',
    ],
    overview: 'Project overview...',
    engineeringContext: 'Technical context...',
    responsibilities: ['...'],
    challenges: ['...'],
    structuralAssessment: '...',
    methodology: '...',
    solutions: ['...'],
    software: ['AutoCAD', 'ETABS'],
    drawings: ['Drawing 1', 'Drawing 2'],
    featured: true,
  },
];
```

### Skills (`src/data/skills.ts`)
```typescript
export const skillCategories: SkillCategory[] = [
  {
    id: 'category-id',
    title: 'Category Title',
    icon: 'IconName', // Monitor, Building, FileText
    skills: [
      { name: 'Skill Name', level: 'expert', description: '...' },
      // Levels: 'expert', 'advanced', 'proficient', 'familiar'
    ],
  },
];
```

### Gallery (`src/data/gallery.ts`)
```typescript
export const galleryItems: GalleryItemEntry[] = [
  {
    id: 'unique-id',
    category: 'Category Name',
    projectId: 'project-id',
    title: 'Image Title',
    description: 'Description...',
    image: '/images/gallery/category/image.jpg',
    thumbnail: '/images/gallery/category/image-thumb.jpg',
    tags: ['tag1', 'tag2'],
  },
];
```

### Adding Images
1. Place images in `public/images/` following the folder structure
2. Use descriptive filenames (kebab-case)
3. Provide both full-size and thumbnail versions
3. Update the corresponding data file with correct paths

### Updating CV
Replace `public/cv.pdf` with your new CV file. The download link in Hero and Header will automatically serve the new file.

### Connecting Contact Form

The contact form currently simulates submission. To connect a real backend:

1. **Formspree / Netlify Forms / EmailJS:**
   Update `ContactPreview.tsx` and `Contact.tsx` to submit to your endpoint:
   ```typescript
   const response = await fetch('https://your-endpoint.com', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData),
   });
   ```

2. **Custom API Route (Vercel/Netlify Functions):**
   Create `api/contact.ts` and update the form to POST to `/api/contact`.

3. **Supabase / Firebase:**
   Use their SDK to insert form data directly.

## 🎨 Design Tokens

Design tokens are defined in `src/index.css` as CSS variables and mirrored in `tailwind.config.js`:

### Colors
```css
--color-midnight-navy: #0a1628;
--color-charcoal: #1a1f2e;
--color-warm-off-white: #faf8f5;
--color-architectural-grey: #6b7280;
--color-muted-bronze: #b8860b;
--color-champagne-gold: #d4a574;
```

### Typography
```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-heading: 'Space Grotesk', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

### Motion
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

## ♿ Accessibility

- Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Skip to main content link
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels on icon-only buttons
- Focus-visible styles on all interactive elements
- Color contrast ratios ≥ 4.5:1
- Reduced motion support via `prefers-reduced-motion`
- Keyboard navigable (Tab, Enter, Space, Escape)

## 📱 Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | 320px - 639px | Single column, stacked layout |
| Tablet | 640px - 1023px | 2-column grids |
| Desktop | 1024px - 1439px | 3-4 column grids |
| Large Desktop | 1440px+ | Full layout with max-width container |

## 🧪 Quality Assurance

### Build Checks
```bash
npm run build        # TypeScript compilation + Vite build
```

### Linting
```bash
npx eslint src/
```

### Browser Testing
The project includes Playwright configuration. Run visual regression tests:
```bash
npx playwright test
```

### Performance
- **Lighthouse Target**: ≥ 90 Performance, ≥ 90 Accessibility, ≥ 90 Best Practices, ≥ 90 SEO
- **Bundle Analysis**: `npm run build` outputs chunk sizes
- **Core Web Vitals**: Optimized for LCP, FID, CLS

## 📄 License

MIT License — feel free to use this as a template for your own portfolio.

## 🙏 Acknowledgments

- Design inspired by leading architectural firms and engineering consultancies
- Three.js for 3D graphics
- Framer Motion for animations
- Tailwind CSS for utility-first styling
- Lucide React for icons
- Inter, Space Grotesk, and JetBrains Mono fonts via Google Fonts