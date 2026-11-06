const DATA_URL = 'data/site.json';
const MODELS_URL = 'data/models.json';
const SLIDESHOW_URL = 'data/slideshow.json';
const ARTICLES_URL = 'content/articles.json';

async function loadData() {
  const [siteRes, modelsRes, slideshowRes, articlesRes] = await Promise.all([
    fetch(DATA_URL, { cache: 'no-store' }),
    fetch(MODELS_URL, { cache: 'no-store' }),
    fetch(SLIDESHOW_URL, { cache: 'no-store' }),
    fetch(ARTICLES_URL, { cache: 'no-store' })
  ]);

  if (!siteRes.ok) throw new Error(`Could not load ${DATA_URL}`);
  if (!modelsRes.ok) throw new Error(`Could not load ${MODELS_URL}`);
  if (!slideshowRes.ok) throw new Error(`Could not load ${SLIDESHOW_URL}`);
  if (!articlesRes.ok) throw new Error(`Could not load ${ARTICLES_URL}`);

  const [data, models, slideshow, articles] = await Promise.all([
    siteRes.json(),
    modelsRes.json(),
    slideshowRes.json(),
    articlesRes.json()
  ]);

  // Combine data into the existing application structure
  data.models = models;
  data.heroSlides = slideshow;
  data.articles = articles;

  return data;
}

function articleFile(id) {
  return `content/articles/${id}.md`;
}
function articleImage(image) {
  return `content/article-images/${image}`;
}

const icon = name => `<span class="material-symbols-rounded">${name}</span>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

// Hero slideshow
function renderHero(data) {
  const slides = (data.heroSlides || []).slice(0, 4);

  if (!slides.length) return;

  const copy = document.getElementById('heroCopy');
  const image = document.getElementById('heroImage');
  const dots = document.getElementById('heroDots');

  const prev = document.getElementById('heroPrev');
  const next = document.getElementById('heroNext');

  let current = 0;
  let timer;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;

    const slide = slides[current];

    // Fade out
    copy.classList.add('hero-fade');
    image.classList.add('hero-fade');

    setTimeout(() => {
      copy.innerHTML = `
        <div class="eyebrow">
          <span class="status-dot"></span>
          ${esc(slide.eyebrow || '')}
        </div>

        <h1>
          ${esc(slide.title || '')}<br>
          <em>${esc(slide.highlight || '')}</em>
        </h1>

        <p class="hero-lead">
          ${esc(slide.description || '')}
        </p>

        <div class="hero-actions">
          ${(slide.actions || []).map(action => `
            <a class="btn btn-${esc(action.style || 'ghost')}"
               href="${esc(action.url)}">
              <span class="material-symbols-rounded">
                ${esc(action.icon || 'arrow_forward')}
              </span>
              ${esc(action.label)}
            </a>
          `).join('')}
        </div>

        <div class="hero-meta">
          ${(slide.meta || []).map((item, i) => `
            <span>
              <b>${String(i + 1).padStart(2, '0')}</b>
              ${esc(item)}
            </span>
          `).join('')}
        </div>
      `;

      image.src = slide.image;
      image.alt = slide.alt || slide.title || 'piBrick';

      // Fade in
      copy.classList.remove('hero-fade');
      image.classList.remove('hero-fade');

      // Update indicators
      dots.querySelectorAll('button').forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
        dot.setAttribute('aria-current', i === current ? 'true' : 'false');
      });

    }, 200);
  }

  // Create slide indicators
  dots.innerHTML = slides.map((slide, i) => `
    <button
      type="button"
      class="${i === 0 ? 'active' : ''}"
      aria-label="Go to slide ${i + 1}"
      aria-current="${i === 0 ? 'true' : 'false'}"
      data-slide="${i}">
    </button>
  `).join('');

  // Navigation
  prev.addEventListener('click', () => {
    showSlide(current - 1);
    restartTimer();
  });

  next.addEventListener('click', () => {
    showSlide(current + 1);
    restartTimer();
  });

  dots.addEventListener('click', e => {
    const dot = e.target.closest('[data-slide]');
    if (!dot) return;

    showSlide(Number(dot.dataset.slide));
    restartTimer();
  });

  // Automatic slideshow
  function restartTimer() {
    clearInterval(timer);

    if (slides.length > 1) {
      timer = setInterval(() => {
        showSlide(current + 1);
      }, 6000);
    }
  }

  showSlide(0);
  restartTimer();
}

// Render homepage YouTube videos
// Render homepage photo gallery and YouTube videos
function renderHomeShowcase(data) {
  const section = document.getElementById('homeVideosSection');
  const gallery = document.getElementById('homeGalleryGrid');
  const videoGrid = document.getElementById('homeVideosGrid');

  if (!section || !gallery || !videoGrid) return;

  const photos = data.homeGallery || [];
  const videos = data.homeVideos || [];

  section.hidden = !photos.length && !videos.length;

  // Photo gallery
  gallery.innerHTML = photos.map(photo => `
    <button class="gallery-item"
      data-src="${esc(photo.src)}"
      data-alt="${esc(photo.alt)}"
      data-label="${esc(photo.label)}"
      data-description="${esc(photo.description || '')}"
      aria-label="View ${esc(photo.label)}">

      <img src="${esc(photo.src)}"
        alt="${esc(photo.alt)}"
        loading="lazy">
    </button>
  `).join('');

  // Photo lightbox with previous / next navigation
  const photoItems = [...gallery.querySelectorAll('.gallery-item')];

  photoItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      openLightbox(photoItems, index);
    });
  });

  // YouTube videos
  videoGrid.innerHTML = videos.map(video => {
    const match = video.url.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );

    if (!match) return '';

    const videoId = match[1];
    const thumbnail = video.thumbnail ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return `
      <button class="video-card"
        data-video-id="${videoId}"
        aria-label="Play ${esc(video.title)}">

        <div class="video-thumbnail">
          <img src="${esc(thumbnail)}"
            alt="${esc(video.title)}"
            loading="lazy">

          <span class="video-play">
            ${icon('play_arrow')}
          </span>
        </div>

        <div class="video-info">
          <h3>${esc(video.title)}</h3>
          <p>${esc(video.description || '')}</p>
        </div>
      </button>
    `;
  }).join('');

  // YouTube video popup
  videoGrid.querySelectorAll('.video-card').forEach(item => {
    item.addEventListener('click', () => {
      const videoId = item.dataset.videoId;

      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox video-lightbox';

      lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Close">
          ${icon('close')}
        </button>

        <div class="video-player">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
      `;

      document.body.appendChild(lightbox);

      const close = () => {
        document.removeEventListener('keydown', escHandler);
        lightbox.remove();
      };

      const escHandler = e => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          close();
        }
      };

      lightbox.querySelector('.lightbox-close')
        .addEventListener('click', close);

      lightbox.addEventListener('click', e => {
        if (e.target === lightbox) close();
      });

      document.addEventListener('keydown', escHandler);
    });
  });
}

function renderHome(data) {
  renderHero(data);
  renderHomeShowcase(data);

  document.querySelectorAll('[data-bind="site.description"]').forEach(el => el.textContent = data.site.description);

  const models = document.getElementById('modelCards');
  models.innerHTML = data.models.map(model => `
    <a class="model-card" href="model.html?id=${encodeURIComponent(model.id)}">
      <div class="model-card-image"><img src="${model.cardImage}" alt="${esc(model.name)}"></div>
      <div class="model-card-content"><span class="tag">${esc(model.status)}</span><h3>${esc(model.name)}</h3><p>${esc(model.summary)}</p><span class="card-link">View model ${icon('arrow_forward')}</span></div>
    </a>`).join('');

  document.getElementById('questionsList').innerHTML = data.quickQuestions.map((item, i) => `
    <div class="faq"><button type="button"><span>${esc(item.q)}</span><span class="icon">${icon('add')}</span></button><div class="faq-answer">${esc(item.a)}</div></div>`).join('');
  document.querySelectorAll('.faq button').forEach(button => button.addEventListener('click', () => button.parentElement.classList.toggle('open')));

  document.getElementById('linksGrid').innerHTML = data.links.map(link => `
    <a class="resource" href="${link.url}" target="_blank" rel="noopener"><div class="icon">${icon(link.icon)}</div><h3>${esc(link.title)}</h3><p>${esc(link.description)}</p></a>`).join('');
  replaceBrandIcons();

  document.getElementById('articlesGrid').innerHTML = data.articles.slice(0,3).map(articleCard).join('');
  document.getElementById('buyGrid').innerHTML = buyCards(data.models[0].buy);
  
  const testimonials = [...data.testimonials]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  document.getElementById('testimonialsGrid').innerHTML =
    testimonials.map(t => `
      <div class="testimonial">
        <blockquote>“${esc(t.quote)}”</blockquote>
        <div class="name">${esc(t.name)}</div>
        <div class="meta">${esc(t.meta)}</div>
      </div>
    `).join('');
}

function articleCard(a) {
  return `
    <a class="article-card" href="article.html?id=${encodeURIComponent(a.id)}">
      <img src="${articleImage(a.cover)}" alt="${esc(a.title)}">
      <div class="article-card-body">
        <div class="date">${esc(a.category)} · ${formatDate(a.date)}</div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt)}</p>
        <span class="card-link">Read article ${icon('arrow_forward')}</span>
      </div>
    </a>
  `;
}

function oldbuyCards(buy) {
  return Object.values(buy).map(item => `<div class="buy-card"><div class="icon">${icon(item.icon)}</div><h3>${esc(item.title)}</h3><div class="price">${esc(item.price)}</div><p>${esc(item.note)}</p><a href="${item.url}" target="_blank" rel="noopener">${item.opentitle} ${icon('arrow_outward')}</a></div>`).join('');
}

function buyCards(buy) {
  return Object.values(buy).map(item => `
    <a class="buy-card"
       href="${esc(item.url)}"
       target="_blank"
       rel="noopener">
      <div class="icon">${icon(item.icon)}</div>
      <h3>${esc(item.title)}</h3>
      <div class="price">${esc(item.price)}</div>
      <p>${esc(item.note)}</p>
      <span class="buy-card-link">
        ${esc(item.opentitle)} ${icon('arrow_outward')}
      </span>
    </a>
  `).join('');
}

function formatDate(value) { return new Intl.DateTimeFormat('en-US', {year:'numeric', month:'short', day:'numeric'}).format(new Date(`${value}T00:00:00`)); }

function renderModel(data) {
  const id = new URLSearchParams(location.search).get('id') || data.models[0]?.id;
  const model = data.models.find(m => m.id === id);
  const root = document.getElementById('modelPage');

  if (!model) {
    root.innerHTML = `<section class="section-pad"><div class="container error">Model not found.</div></section>`;
    return;
  }

  document.title = `${model.name} — piBrick`;

  const modelSplit = model.name.split(' ', 2);

  // Render model page
  root.innerHTML = `
    <section class="model-hero">
      <div class="container model-hero-grid">
        <div>
          <div class="eyebrow">
            <span class="status-dot"></span>
            ${esc(model.status)} · ${esc(model.eyebrow)}
          </div>
          <h1>${esc(modelSplit[0])}<br><em>${esc(modelSplit[1])}</em></h1>
          <p>${esc(model.summary)}</p>
          <div class="pill-row">
            ${model.highlights.map(x => `<span class="pill">${esc(x)}</span>`).join('')}
          </div>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#modelBuy">${icon('shopping_bag')} Buy / Preorder</a>
            <a class="btn btn-ghost" href="#gallery">${icon('photo_library')} Photos</a>
          </div>
        </div>
        <div class="model-hero-image">
          <img src="${model.hero}" alt="${esc(model.name)}">
        </div>
      </div>
    </section>

    <section class="section-pad">
      <div class="container">
        <div class="section-head">
          <div>
            <div class="kicker">Technical details</div>
            <h2>Specifications.</h2>
          </div>
        </div>

        <div class="spec-layout">
          <div class="spec-table">
            ${model.specs.map(row => `
              <div class="spec-row">
                <strong>${esc(row[0])}</strong>
                <span>${esc(row[1])}</span>
              </div>
            `).join('')}
          </div>

          <div class="board-map">
            <img src="${model.specsImage}" alt="Specifications diagram for ${esc(model.name)}">
          </div>
        </div>
      </div>
    </section>

    <section class="section-pad" id="gallery">
      <div class="container">
        <div class="section-head">
          <div>
            <div class="kicker">See it in the real world</div>
            <h2>Photos.</h2>
          </div>
        </div>

        <div class="gallery">
          ${(model.gallery || []).map(g => `
            <button class="gallery-item"
              data-src="${esc(g.src)}"
              data-alt="${esc(g.alt)}">
              <img src="${esc(g.src)}" alt="${esc(g.alt)}">
              <span>${esc(g.label)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </section>

    ${model.videos?.length ? `
    <section class="section-pad" id="videos">
      <div class="container">
        <div class="section-head">
          <div>
            <div class="kicker">Watch piBrick in action</div>
            <h2>Videos.</h2>
          </div>
        </div>

        <div class="video-grid">
          ${model.videos.map(video => {
            // Extract YouTube video ID
            const match = video.url.match(
              /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
            );

            if (!match) return '';

            const videoId = match[1];
            const thumbnail = video.thumbnail ||
              `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            return `
              <button class="video-card"
                data-video-id="${videoId}"
                aria-label="Play ${esc(video.title)}">

                <div class="video-thumbnail">
                  <img src="${esc(thumbnail)}"
                    alt="${esc(video.title)}"
                    loading="lazy">

                  <span class="video-play">
                    ${icon('play_arrow')}
                  </span>
                </div>

                <div class="video-info">
                  <h3>${esc(video.title)}</h3>
                  <p>${esc(video.description || '')}</p>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    ${model.faq?.length ? `
      <section class="section-pad" id="modelFaq">
        <div class="container">
          <div class="section-head">
            <div>
              <div class="kicker">Need to know</div>
              <h2>Questions & <span>answers.</span></h2>
            </div>
          </div>

          <div class="questions-list">
            ${model.faq.map((item, i) => `
              <div class="faq">
                <button type="button"
                        aria-expanded="false"
                        aria-controls="modelFaqAnswer${i}">
                  <span>${esc(item.question)}</span>
                  <span class="icon">${icon('add')}</span>
                </button>
                <div class="faq-answer" id="modelFaqAnswer${i}">
                  ${esc(item.answer)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    ` : ''}

    <section class="section-pad" id="modelBuy">
      <div class="container">
        <div class="section-head">
          <div>
            <div class="kicker">Get PocketCM5</div>
            <h2>Your <span>build path.</span></h2>
          </div>
        </div>

        <div class="model-buy">
          ${buyCards(model.buy)}
        </div>
        <p>
          <a
            class="buy-guide-link"
            href="https://wiki.pibrick.net/Where-to-Buy-piBrick"
            target="_blank"
            rel="noopener"
          >
            <span class="material-symbols-rounded">help</span>
            Not sure which buy option to choose?
            <span class="material-symbols-rounded">arrow_outward</span>
          </a>
        </p>
      </div>
    </section>
  `;

  // Model Q&A accordion
  root.querySelectorAll('#modelFaq .faq > button').forEach(button => {
    button.addEventListener('click', () => {
      const faq = button.closest('.faq');
      const isOpen = faq.classList.toggle('open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // Gallery image popup
  const photoItems = [...root.querySelectorAll('.gallery-item')];
  photoItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      openLightbox(photoItems, index);
    });
  });

  // YouTube video popup
  document.querySelectorAll('.video-card').forEach(item => {
    item.addEventListener('click', () => {
      const videoId = item.dataset.videoId;

      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox video-lightbox';

      lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Close">
          ${icon('close')}
        </button>

        <div class="video-player">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
      `;

      document.body.appendChild(lightbox);

      const close = () => {
        document.removeEventListener('keydown', escHandler);
        lightbox.remove();
      };

      const escHandler = e => {
        if (e.key === 'Escape') close();
      };

      lightbox.querySelector('.lightbox-close')
        .addEventListener('click', close);

      lightbox.addEventListener('click', e => {
        if (e.target === lightbox) close();
      });

      document.addEventListener('keydown', escHandler);
    });
  });
}

function closeLightbox() {
  const box = document.getElementById('lightbox');

  if (!box) return;

  // Remove keyboard navigation handler
  if (box._galleryKeyHandler) {
    document.removeEventListener('keydown', box._galleryKeyHandler);
    box._galleryKeyHandler = null;
  }

  // Hide the lightbox
  box.hidden = true;
}

function openLightbox(items, index) {
  if (!items.length) return;

  const box = document.getElementById('lightbox');
  if (!box) return;

  const img = box.querySelector('img');
  let current = index;

  // Create caption if it doesn't exist
  let caption = box.querySelector('.lightbox-caption');

  if (!caption) {
    caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    box.appendChild(caption);
  }

  // Create navigation buttons if needed
  if (!box.querySelector('.lightbox-prev')) {
    box.insertAdjacentHTML('beforeend', `
      <button class="lightbox-nav lightbox-prev" aria-label="Previous photo">
        ${icon('chevron_left')}
      </button>
      <button class="lightbox-nav lightbox-next" aria-label="Next photo">
        ${icon('chevron_right')}
      </button>
    `);
  }

  const showImage = index => {
    current = (index + items.length) % items.length;

    const item = items[current];

    img.src = item.dataset.src;
    img.alt = item.dataset.alt || '';

    caption.innerHTML = `
      <h3>${esc(item.dataset.label || '')}</h3>
      <p>${esc(item.dataset.description || '')}</p>
    `;
  };

  const prev = box.querySelector('.lightbox-prev');
  const next = box.querySelector('.lightbox-next');

  prev.replaceWith(prev.cloneNode(true));
  next.replaceWith(next.cloneNode(true));

  box.querySelector('.lightbox-prev').addEventListener('click', e => {
    e.stopPropagation();
    showImage(current - 1);
  });

  box.querySelector('.lightbox-next').addEventListener('click', e => {
    e.stopPropagation();
    showImage(current + 1);
  });

  const keyHandler = e => {
    if (box.hidden) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showImage(current - 1);
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showImage(current + 1);
    }

    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      closeLightbox();
    }
  };

  document.removeEventListener('keydown', box._galleryKeyHandler);
  box._galleryKeyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);

  // Mouse wheel navigation
  const wheelHandler = e => {
    if (box.hidden) return;

    e.preventDefault();

    if (e.deltaY > 0) {
      showImage(current + 1); // Scroll down = next
    } else if (e.deltaY < 0) {
      showImage(current - 1); // Scroll up = previous
    }
  };

  // Remove previous wheel handler
  if (box._galleryWheelHandler) {
    box.removeEventListener('wheel', box._galleryWheelHandler);
  }

  box._galleryWheelHandler = wheelHandler;

  box.addEventListener('wheel', wheelHandler, { passive: false });

  showImage(index);
  box.hidden = false;
}

async function renderArticles(data) {
  document.getElementById('allArticles').innerHTML = data.articles.map(articleCard).join('');
}

async function renderArticle(data) {

  const id = new URLSearchParams(location.search).get('id');
  const item = data.articles.find(a => a.id === id) || data.articles[0];

  if (!item) return;

  document.title = `${item.title} — piBrick`;

  document.getElementById('articleHeader').innerHTML = `
    <div class="article-head">
      <div class="date">
        ${esc(item.category)} · ${formatDate(item.date)}
      </div>
      <h1>${esc(item.title)}</h1>
      <p>${esc(item.excerpt)}</p>
      <img class="article-cover"
        src="${articleImage(item.cover)}"
        alt="${esc(item.title)}">
    </div>
  `;

  const content = document.getElementById('articleContent');

  try {
    const response = await fetch(articleFile(item.id), {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Article file could not be loaded.');
    }

    const markdown = await response.text();

    content.innerHTML = window.marked
      ? marked.parse(markdown)
      : `<pre>${esc(markdown)}</pre>`;

  } catch (error) {
    content.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

// Handle homepage anchor navigation from other pages
function handleHomeAnchorNavigation() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const url = new URL(link.href, location.href);
    const homePath = new URL('./', location.href).pathname;

    if (
      document.body.dataset.page !== 'home' &&
      url.pathname === homePath &&
      url.hash
    ) {
      e.preventDefault();

      const target = url.hash.substring(1);
      location.href = `${homePath}?scrollTo=${encodeURIComponent(target)}`;
    }
  });
}

// Scroll to requested section after homepage content is rendered
function scrollToHomeSection() {
  const params = new URLSearchParams(location.search);
  const targetId = params.get('scrollTo') || location.hash.substring(1);

  if (!targetId) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        history.replaceState(null, '', `#${targetId}`);
      }
    });
  });
}

function replaceBrandIcons() {
  
  const icons = {
    discord: `
      <svg viewBox="0 0 127.14 96.36"
         xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true"
         style="width:1em;height:1em;display:block;fill:currentColor;">
        <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.84 97.68 97.68 0 0 0-29.08 0A72.37 72.37 0 0 0 45.67 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.7 56.6.54 80.21a105.73 105.73 0 0 0 32.12 16.15 77.7 77.7 0 0 0 6.88-11.11 68.42 68.42 0 0 1-10.83-5.17c.91-.67 1.8-1.37 2.66-2.08a75.84 75.84 0 0 0 64.44 0c.87.71 1.76 1.41 2.66 2.08a68.68 68.68 0 0 1-10.85 5.18 77.2 77.2 0 0 0 6.88 11.1 105.25 105.25 0 0 0 32.13-16.14c2.64-27.38-4.52-51.1-18.93-72.15ZM42.45 65.69c-6.28 0-11.45-5.72-11.45-12.75s5.06-12.75 11.45-12.75 11.56 5.77 11.45 12.75c0 7.03-5.06 12.75-11.45 12.75Zm42.24 0c-6.28 0-11.45-5.72-11.45-12.75s5.06-12.75 11.45-12.75 11.56 5.77 11.45 12.75c0 7.03-5.06 12.75-11.45 12.75Z"/>
      </svg>
    `,

    github: `
      <svg viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style="width:1em;height:1em;display:block;fill:currentColor;">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.333-5.467-5.933 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.552 3.295-1.23 3.295-1.23.655 1.653.243 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.613-2.807 5.63-5.48 5.922.43.37.815 1.102.815 2.222 0 1.605-.015 2.898-.015 3.293 0 .322.216.696.825.577C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12Z"/>
      </svg>
    `
  };

  document.querySelectorAll('.material-symbols-rounded').forEach(el => {
    const name = el.textContent.trim().toLowerCase();
    const svg = icons[name];

    if (!svg) return;

    el.innerHTML = svg;
    el.setAttribute('aria-label', name);
    el.setAttribute('role', 'img');
  });
}

function replaceDiscordIcons() {
  const discordSvg = `
    <svg viewBox="0 0 127.14 96.36"
         xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true"
         style="width:1em;height:1em;display:block;fill:currentColor;">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.84 97.68 97.68 0 0 0-29.08 0A72.37 72.37 0 0 0 45.67 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.7 56.6.54 80.21a105.73 105.73 0 0 0 32.12 16.15 77.7 77.7 0 0 0 6.88-11.11 68.42 68.42 0 0 1-10.83-5.17c.91-.67 1.8-1.37 2.66-2.08a75.84 75.84 0 0 0 64.44 0c.87.71 1.76 1.41 2.66 2.08a68.68 68.68 0 0 1-10.85 5.18 77.2 77.2 0 0 0 6.88 11.1 105.25 105.25 0 0 0 32.13-16.14c2.64-27.38-4.52-51.1-18.93-72.15ZM42.45 65.69c-6.28 0-11.45-5.72-11.45-12.75s5.06-12.75 11.45-12.75 11.56 5.77 11.45 12.75c0 7.03-5.06 12.75-11.45 12.75Zm42.24 0c-6.28 0-11.45-5.72-11.45-12.75s5.06-12.75 11.45-12.75 11.56 5.77 11.45 12.75c0 7.03-5.06 12.75-11.45 12.75Z"/>
    </svg>
  `;

  document.querySelectorAll('.material-symbols-rounded').forEach(el => {
    if (el.textContent.trim().toLowerCase() !== 'discord') return;

    el.innerHTML = discordSvg;
    el.setAttribute('aria-label', 'Discord');
    el.setAttribute('role', 'img');
  });
}

document.addEventListener('DOMContentLoaded', replaceBrandIcons);
handleHomeAnchorNavigation();
replaceBrandIcons();

function renderFooter(page){
  const footer = document.querySelector('footer.site-footer');
  if (!footer) return;

  const modelsLink = page === 'home' ? '#models' : './#models';
  const buyLink = page === 'model' ? '#modelBuy': (page==='home' ? '#buy' : './#buy');
  
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="container footer-grid">
      <div>
        <a href="./"><img
          class="footer-logo"
          src="assets/images/pibrick-logo.svg"
          alt="piBrick"
        /></a>
        <p>Open hardware. Pocket-sized Linux.</p>
      </div>
      <div>
        <span class="footer-title">Explore</span><a href="${modelsLink}">Models</a
        ><a href="./articles.html">Articles</a><a href="${buyLink}">Buy / Build</a>
      </div>
      <div>
        <span class="footer-title">Open source</span
        ><a href="https://github.com/amarullz/pibrick">GitHub</a
        ><a href="https://wiki.pibrick.net">Wiki</a
        ><a href="https://discord.gg/e9qUdJ4aVr">Discord</a>
      </div>
      <div>
        <span class="footer-title">Tools</span
        ><a href="https://serial.pibrick.net/">Serial Shell</a
        ><a href="https://vial.rocks/">Keyboard Layout</a>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© <span id="year">${year}</span> piBrick - <a href="terms.html">Terms of Service</a> -
        <a href="privacy.html">Privacy Policy</a></span
      ><span>Open hardware by <a href="https://amarullz.com" target="_blank"
        rel="noopener">amarullz.com</a></span>
    </div>
  `;
}

(async function init() {
  try {
    const data = await loadData();
    const page = document.body.dataset.page;
    if (page === 'home') {
      renderHome(data);
      scrollToHomeSection();
    }
    if (page === 'model') renderModel(data);
    if (page === 'articles') renderArticles(data);
    if (page === 'article') renderArticle(data);
    const close = document.querySelector('.lightbox-close');
    if (close) close.addEventListener('click', () => closeLightbox());
    const box = document.getElementById('lightbox');
    if (box) box.addEventListener('click', e => { if (e.target === box) closeLightbox(); });
    renderFooter(page);
  } catch (error) {
    console.error(error);
    const target = document.querySelector('main') || document.body;
    target.insertAdjacentHTML('afterbegin', `<div class="container error">Site data could not be loaded. Check that this site is running through GitHub Pages or another HTTP server.</div>`);
  }
})();
