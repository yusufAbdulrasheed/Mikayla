const today = () => new Date().toISOString().slice(0, 10);

export const collectionsConfig = {
  posts: {
    path: 'stories', title: 'Stories', singular: 'story', icon: '✎',
    intro: 'Essays, notes and articles. They appear in “The writing” on the home page and on their own page.',
    sortable: false,
    thumb: (i) => i.cover,
    name: (i) => i.title,
    sub: (i) => `${i.category || 'Story'} · ${i.publishedAt || ''} · ${i.readTime || 4} min read`,
    viewUrl: (i) => `/writing/${i.slug}`,
    blank: () => ({ title: '', excerpt: '', category: 'Essay', cover: '', readTime: 4, publishedAt: today(), featured: false, published: true, body: '' }),
    fields: [
      { key: 'title', label: 'Title', max: 160 },
      { key: 'excerpt', label: 'Short summary', type: 'textarea', rows: 3, max: 500, help: 'Shown on the story card and under the title.' },
      { key: 'cover', label: 'Cover photo', type: 'image' },
      { key: 'body', label: 'The story', type: 'paras', rows: 14, help: 'Write normally. Leave a blank line between paragraphs.' },
      { key: 'category', label: 'Category', max: 40, placeholder: 'Essay, Lifestyle, Creator Notes…' },
      { key: 'readTime', label: 'Minutes to read', type: 'number' },
      { key: 'publishedAt', label: 'Date', type: 'date' },
      { key: 'published', label: 'Show on the website', type: 'bool', help: 'Turn off to keep it as a private draft.' },
    ],
  },
  services: {
    path: 'services', title: 'Services', singular: 'service', icon: '✦',
    intro: 'The “Work with me” cards. Use the arrows to change the order.',
    sortable: true,
    name: (i) => i.title,
    sub: (i) => i.blurb,
    blank: () => ({ title: '', blurb: '', icon: '' }),
    fields: [
      { key: 'icon', label: 'Number or label', max: 8, placeholder: '01' },
      { key: 'title', label: 'Service name', max: 80 },
      { key: 'blurb', label: 'Short description', type: 'textarea', rows: 3, max: 300 },
    ],
  },
  gallery: {
    path: 'photos', title: 'Photos', singular: 'photo', icon: '▣',
    intro: 'The “little moments” gallery. Upload several at once, then add captions.',
    sortable: true,
    thumb: (i) => i.src,
    name: (i) => i.caption || 'Untitled photo',
    sub: (i) => i.alt,
    blank: () => ({ src: '', alt: '', caption: '', published: true }),
    bulk: { field: 'src', defaults: { alt: '', caption: '', published: true } },
    fields: [
      { key: 'src', label: 'Photo', type: 'image' },
      { key: 'caption', label: 'Caption', max: 160, help: 'Shown on the photo.' },
      { key: 'alt', label: 'Describe the photo', max: 160, help: 'For people using screen readers. One short sentence.' },
      { key: 'published', label: 'Show on the website', type: 'bool' },
    ],
  },
  videos: {
    path: 'videos', title: 'Videos', singular: 'video', icon: '▶',
    intro: 'Upload a video file, or paste a YouTube or Vimeo link. The section appears on the home page once you add one.',
    sortable: true,
    thumb: (i) => i.poster,
    name: (i) => i.title,
    sub: (i) => (i.file ? 'Uploaded video' : i.embedUrl ? 'Linked video' : 'No video yet'),
    blank: () => ({ title: '', description: '', file: '', poster: '', embedUrl: '', published: true }),
    fields: [
      { key: 'title', label: 'Title', max: 140 },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, max: 600 },
      { key: 'file', label: 'Video file', type: 'video', help: 'Upload from your phone or computer.' },
      { key: 'embedUrl', label: 'Or a video link', type: 'link', placeholder: 'https://www.youtube.com/watch?v=…', help: 'YouTube and Vimeo play on the page. Other links (Instagram, TikTok) open in a new tab. Ignored if you upload a file.' },
      { key: 'poster', label: 'Cover image (optional)', type: 'image', help: 'Shown before the video plays.' },
      { key: 'published', label: 'Show on the website', type: 'bool' },
    ],
  },
  books: {
    path: 'books', title: 'Books', singular: 'book', icon: '❡',
    intro: 'Your books and reading. Add a cover, a buy link and/or a downloadable PDF or EPUB.',
    sortable: true,
    thumb: (i) => i.cover,
    name: (i) => i.title,
    sub: (i) => ({ available: 'Available now', 'coming-soon': 'Coming soon', free: 'Free to read' }[i.status] || ''),
    blank: () => ({ title: '', subtitle: '', description: '', cover: '', status: 'available', buyUrl: '', file: '', fileLabel: '', year: '', published: true }),
    fields: [
      { key: 'title', label: 'Title', max: 140 },
      { key: 'subtitle', label: 'Subtitle', max: 180 },
      { key: 'description', label: 'About the book', type: 'textarea', rows: 5, max: 1200 },
      { key: 'cover', label: 'Cover', type: 'image' },
      { key: 'status', label: 'Status', type: 'select', options: [{ value: 'available', label: 'Available now' }, { value: 'coming-soon', label: 'Coming soon' }, { value: 'free', label: 'Free to read' }] },
      { key: 'year', label: 'Year', max: 8, placeholder: '2026' },
      { key: 'buyUrl', label: 'Where to get it', type: 'link', help: 'A link to a shop, Paystack/Selar page, or reading page.' },
      { key: 'file', label: 'Downloadable file', type: 'doc', help: 'Lets visitors download the book or a sample chapter.' },
      { key: 'fileLabel', label: 'Download button text', max: 40, placeholder: 'Download a free chapter' },
      { key: 'published', label: 'Show on the website', type: 'bool', help: 'Turn off to hide it until you’re ready.' },
    ],
  },
  reviews: {
    path: 'reviews', title: 'Book reviews', singular: 'review', icon: '★',
    intro: 'Every book you have reviewed. Add the cover, a star rating and your thoughts. Newest reviews show first on the website.',
    sortable: false,
    thumb: (i) => i.cover,
    name: (i) => i.title,
    sub: (i) => `${i.author ? `${i.author} · ` : ''}${'★'.repeat(i.rating || 0)}${'☆'.repeat(5 - (i.rating || 0))} · ${i.reviewedAt || ''}`,
    blank: () => ({ title: '', author: '', cover: '', rating: 5, genre: '', reviewedAt: today(), verdict: '', review: '', reviewUrl: '', published: true }),
    fields: [
      { key: 'title', label: 'Book title', max: 160 },
      { key: 'author', label: 'Author', max: 120 },
      { key: 'cover', label: 'Book cover', type: 'image' },
      {
        key: 'rating', label: 'Your rating', type: 'select',
        options: [
          { value: 5, label: '★★★★★  5 — Loved it' }, { value: 4, label: '★★★★☆  4 — Really good' }, { value: 3, label: '★★★☆☆  3 — It was okay' },
          { value: 2, label: '★★☆☆☆  2 — Not for me' }, { value: 1, label: '★☆☆☆☆  1 — Did not like it' },
        ],
      },
      { key: 'genre', label: 'Genre', max: 60, placeholder: 'Romance, Memoir, Fantasy…' },
      { key: 'reviewedAt', label: 'Date reviewed', type: 'date' },
      { key: 'verdict', label: 'One-line verdict', max: 180, help: 'A short, quotable line shown on the card.' },
      { key: 'review', label: 'Your full review', type: 'paras', rows: 10, help: 'Optional. Visitors can open it from the card. Leave a blank line between paragraphs.' },
      { key: 'reviewUrl', label: 'Link to the review', type: 'link', help: 'Optional. Where the review lives, such as Medium, YouTube, Goodreads or Instagram.' },
      { key: 'published', label: 'Show on the website', type: 'bool' },
    ],
  },
};

const heading = (p, label) => [
  { path: `${p}.kicker`, label: `${label}: small label`, max: 80 },
  { path: `${p}.heading`, label: `${label}: heading`, max: 120 },
  { path: `${p}.emphasis`, label: `${label}: highlighted words`, max: 120, help: 'Shown in italic pink after the heading.' },
];

const RANGES = [['d7', 'Last 7 days'], ['d30', 'Last 30 days'], ['d90', 'Last 90 days'], ['y1', 'Last 12 months']];
const PLATFORMS = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['x', 'X (Twitter)'], ['medium', 'Medium']];

export const settingsTabs = [
  {
    id: 'brand', label: 'You & contact',
    fields: [
      { path: 'brand.name', label: 'Full name', max: 80 },
      { path: 'brand.first', label: 'First name (shown in the logo)', max: 40 },
      { path: 'brand.email', label: 'Contact email', max: 160, help: 'The “email me” links use this address.' },
      {
        path: 'social', label: 'Social media links', type: 'repeater', max: 12, addLabel: 'Add a link', blank: { platform: '', url: '' },
        help: 'Shown in the footer and the contact section.',
        fields: [
          { key: 'platform', label: 'Name', placeholder: 'Instagram', max: 40 },
          { key: 'url', label: 'Link', placeholder: 'https://instagram.com/yourname' },
        ],
      },
    ],
  },
  {
    id: 'hero', label: 'Cover (top of page)',
    fields: [
      { path: 'hero.mast', label: 'Big name across the top', max: 24, help: 'Capital letters look best. Short names appear larger.' },
      { path: 'hero.tag', label: 'Line under the name', max: 120 },
      { path: 'hero.photo', label: 'Cover photo', type: 'image', help: 'A portrait photo works best.' },
      { path: 'hero.quote', label: 'Quote on the photo', type: 'textarea', rows: 2, max: 200, help: 'Two lines. The second line is shown in italic.' },
      { path: 'hero.badge', label: 'Round sticker text', type: 'textarea', rows: 2, max: 40, help: 'Leave empty to hide the sticker.' },
      { path: 'hero.issue', label: 'Issue number', max: 30 },
      { path: 'hero.date', label: 'Date', max: 40 },
      { path: 'hero.label', label: 'Magazine title (top middle)', max: 60 },
      { path: 'hero.ctaLabel', label: 'Main button text', max: 40 },
      { path: 'hero.leftLines', label: 'Cover lines on the left', type: 'repeater', max: 4, addLabel: 'Add a line', blank: { k: '', t: '' }, fields: [{ key: 'k', label: 'Headline', max: 40 }, { key: 't', label: 'Text', max: 120 }] },
      { path: 'hero.rightLines', label: 'Cover lines on the right', type: 'repeater', max: 4, addLabel: 'Add a line', blank: { k: '', t: '' }, fields: [{ key: 'k', label: 'Headline', max: 40 }, { key: 't', label: 'Text', max: 120 }] },
    ],
  },
  {
    id: 'about', label: 'About you',
    fields: [
      ...heading('about', 'About'),
      { path: 'about.body', label: 'Your story', type: 'textarea', rows: 8, max: 3000, help: 'Leave a blank line between paragraphs.' },
      { path: 'about.photo', label: 'Photo', type: 'image' },
      { path: 'about.stamp', label: 'Caption on the photo', type: 'textarea', rows: 2, max: 60 },
      { path: 'about.stats', label: 'Little facts', type: 'repeater', max: 4, addLabel: 'Add a fact', blank: { value: '', label: '' }, fields: [{ key: 'value', label: 'Big number or symbol', max: 12, placeholder: '3' }, { key: 'label', label: 'Label', max: 40, placeholder: 'Hats worn daily' }] },
    ],
  },
  {
    id: 'analytics', label: 'Social analytics',
    fields: [
      { path: 'analytics.show', label: 'Show the analytics section on the website', type: 'bool', help: 'It only appears once at least one number is above zero.' },
      ...PLATFORMS.flatMap(([id, name]) => [
        { path: `h.${id}`, label: name, type: 'heading' },
        { path: `analytics.${id}.handle`, label: `${name} username`, max: 60, placeholder: '@yourname' },
        { path: `analytics.${id}.followers`, label: 'Followers right now', type: 'number' },
      ]),
      { path: 'h.ranges', label: 'Numbers for each time period', type: 'heading' },
      ...RANGES.map(([id, name]) => ({
        path: `analytics.ranges.${id}`, label: name, type: 'metrics', platforms: PLATFORMS,
        help: id === 'd7' ? 'Copy these from each app’s analytics page for the same dates. Leave a whole period at zero to hide it from visitors.' : undefined,
      })),
      ...heading('analytics', 'Analytics'),
    ],
  },
  {
    id: 'nursing', label: 'Nursing section',
    fields: [
      ...heading('nursing', 'Nursing'),
      { path: 'nursing.body', label: 'Text', type: 'textarea', rows: 6, max: 2000 },
      { path: 'nursing.photo', label: 'Photo', type: 'image' },
      { path: 'nursing.label', label: 'Tag on the photo', max: 60 },
      { path: 'nursing.ctaLabel', label: 'Link text', max: 40 },
    ],
  },
  {
    id: 'titles', label: 'Section titles',
    fields: [
      ...heading('work', 'Services'),
      ...heading('writing', 'Writing'),
      ...heading('videos', 'Videos'),
      ...heading('moments', 'Photos'),
      ...heading('books', 'Books'),
      ...heading('reviews', 'Book reviews'),
      { path: 'marquee', label: 'Scrolling words (one per line)', type: 'lines', rows: 7, help: 'The moving strip under the cover.' },
    ],
  },
  {
    id: 'contact', label: 'Contact & footer',
    fields: [
      ...heading('contact', 'Contact'),
      { path: 'contact.text', label: 'Text under the heading', type: 'textarea', rows: 3, max: 500 },
      { path: 'footer.note', label: 'Footer message', max: 160 },
    ],
  },
  {
    id: 'seo', label: 'Google & sharing',
    fields: [
      { path: 'seo.title', label: 'Website title', max: 120, help: 'Shown in the browser tab and Google results.' },
      { path: 'seo.description', label: 'Short description', type: 'textarea', rows: 3, max: 300, help: 'The grey text under your site in Google results.' },
    ],
  },
];

export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
export const setPath = (obj, path, value) => {
  const [head, ...rest] = path.split('.');
  return { ...obj, [head]: rest.length ? setPath(obj[head] || {}, rest.join('.'), value) : value };
};
