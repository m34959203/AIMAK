#!/usr/bin/env node

/**
 * Полный импорт статей с WordPress с:
 * - Разными категориями
 * - Всеми изображениями (featured + из контента)
 * - Сохранением HTML форматирования
 */

const https = require('https');
const http = require('http');
const path = require('path');

const OLD_SITE = 'https://aimaqaqshamy.kz';
const NEW_API = process.env.NEW_API_URL || 'https://aimak-api-w8ps.onrender.com';
const ADMIN_EMAIL = 'admin@aimakakshamy.kz';
const ADMIN_PASSWORD = 'admin123';

// Маппинг категорий WordPress → наша система
const CATEGORY_MAPPING = {
  // По умолчанию все идут в ЖАҢАЛЫҚТАР
  'default': 'zhanalyqtar',
  // Можно добавить специфичные маппинги если известны категории
};

let accessToken = null;
let adminId = null;
let categoriesCache = {};
let wpCategoriesCache = {};

// HTTP запрос
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.request(url, options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(bodyStr);
    }

    req.end();
  });
}

// Скачать файл
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    lib.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Редирект
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'image/jpeg';
        resolve({ buffer, contentType });
      });
    }).on('error', reject);
  });
}

// Загрузить изображение
function uploadImage(buffer, contentType, filename) {
  return new Promise((resolve) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`,
      'utf8'
    );

    const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([header, buffer, footer]);

    const urlObj = new URL(`${NEW_API}/api/media/upload`);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(response.url);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));

    req.write(body);
    req.end();
  });
}

// Логин
async function login() {
  console.log('🔐 Вход в систему...');

  const response = await request(`${NEW_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });

  if (response.status === 200 || response.status === 201) {
    accessToken = response.body.accessToken;
    adminId = response.body.user.id;
    console.log('✅ Вход выполнен\n');
    return true;
  } else {
    console.error('❌ Ошибка входа:', response.body);
    return false;
  }
}

// Получить категории из новой системы
async function loadCategories() {
  const response = await request(`${NEW_API}/api/categories`);
  if (response.status === 200) {
    response.body.forEach(cat => {
      categoriesCache[cat.slug] = cat;
    });
    console.log(`✅ Загружено ${Object.keys(categoriesCache).length} категорий\n`);
  }
}

// Получить категории WordPress
async function loadWPCategories() {
  try {
    const response = await request(`${OLD_SITE}/wp-json/wp/v2/categories?per_page=100`);
    if (response.status === 200) {
      response.body.forEach(cat => {
        wpCategoriesCache[cat.id] = cat;
      });
      console.log(`✅ Загружено ${Object.keys(wpCategoriesCache).length} категорий WordPress\n`);
    }
  } catch (error) {
    console.log('⚠️  Не удалось загрузить категории WordPress');
  }
}

// Определить категорию для статьи
function getTargetCategory(wpCategoryIds) {
  // Пока все статьи идут в "Жаңалықтар"
  // TODO: можно добавить маппинг по названиям категорий
  return categoriesCache['zhanalyqtar'];
}

// Получить статьи из WordPress
async function getWordPressPosts(page = 1, perPage = 10) {
  const url = `${OLD_SITE}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed`;

  try {
    const response = await request(url);
    const totalPages = response.headers['x-wp-totalpages'];

    return {
      posts: response.body,
      totalPages: parseInt(totalPages) || 1
    };
  } catch (error) {
    console.error('Ошибка получения статей:', error.message);
    return { posts: [], totalPages: 0 };
  }
}

// Обработать изображения в контенте
async function processContentImages(html) {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let match;
  const replacements = [];

  // Найти все изображения
  while ((match = imgRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const imgUrl = match[1];

    // Пропускаем если это не с нашего старого сайта
    if (!imgUrl.includes('aimaqaqshamy.kz') && !imgUrl.startsWith('http')) {
      continue;
    }

    const absoluteUrl = imgUrl.startsWith('http') ? imgUrl : `${OLD_SITE}${imgUrl}`;

    replacements.push({
      original: imgUrl,
      url: absoluteUrl,
      tag: fullTag
    });
  }

  // Скачать и загрузить все изображения
  for (const img of replacements) {
    try {
      const { buffer, contentType } = await downloadFile(img.url);
      const filename = path.basename(new URL(img.url).pathname);
      const newUrl = await uploadImage(buffer, contentType, filename);

      if (newUrl) {
        // Заменить URL в HTML
        html = html.replace(new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        process.stdout.write('🖼️');
      }
    } catch (error) {
      // Пропускаем изображение если не удалось загрузить
    }
  }

  return html;
}

// Очистка HTML
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Создать slug
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[қ]/g, 'q')
    .replace(/[ә]/g, 'a')
    .replace(/[ғ]/g, 'g')
    .replace(/[ұ]/g, 'u')
    .replace(/[ү]/g, 'u')
    .replace(/[і]/g, 'i')
    .replace(/[ң]/g, 'n')
    .replace(/[һ]/g, 'h')
    .replace(/[ө]/g, 'o')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Импортировать статью
async function importArticle(wpPost) {
  const title = stripHtml(wpPost.title.rendered);
  let content = wpPost.content.rendered;
  const excerpt = wpPost.excerpt ? stripHtml(wpPost.excerpt.rendered) : title.substring(0, 200);
  const slug = createSlug(title);

  // Определить категорию
  const category = getTargetCategory(wpPost.categories);
  if (!category) {
    return { success: false, error: 'No category found' };
  }

  let coverImageUrl = null;

  // Главное изображение
  if (wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0]) {
    const featuredMedia = wpPost._embedded['wp:featuredmedia'][0];
    const imageUrl = featuredMedia.source_url;

    if (imageUrl) {
      process.stdout.write('📷');
      try {
        const { buffer, contentType } = await downloadFile(imageUrl);
        const filename = path.basename(new URL(imageUrl).pathname);
        coverImageUrl = await uploadImage(buffer, contentType, filename);
      } catch (error) {
        // Пропускаем
      }
    }
  }

  // Обработать изображения в контенте
  content = await processContentImages(content);

  const articleData = {
    titleKz: title,
    slugKz: slug + '-' + wpPost.id,
    contentKz: content,
    excerptKz: excerpt,
    categoryId: category.id,
    authorId: adminId,
    status: 'PUBLISHED',
    published: true,
    publishedAt: wpPost.date,
  };

  if (coverImageUrl) {
    articleData.coverImage = coverImageUrl;
  }

  try {
    const response = await request(`${NEW_API}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: articleData
    });

    if (response.status === 200 || response.status === 201) {
      return { success: true, article: response.body };
    } else {
      return { success: false, error: response.body };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Главная функция
async function main() {
  console.log('📰 ПОЛНЫЙ ИМПОРТ СТАТЕЙ С WORDPRESS');
  console.log('=====================================\n');

  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : 20;

  // Вход
  const loggedIn = await login();
  if (!loggedIn) {
    process.exit(1);
  }

  // Загрузить категории
  await loadCategories();
  await loadWPCategories();

  console.log(`📊 Импорт первых ${limit} статей...\n`);

  let imported = 0;
  let failed = 0;
  let page = 1;
  const perPage = 10;

  while (imported < limit) {
    const { posts, totalPages } = await getWordPressPosts(page, perPage);

    if (posts.length === 0) {
      break;
    }

    for (const post of posts) {
      if (imported >= limit) break;

      const wpCategory = wpCategoriesCache[post.categories[0]];
      const catName = wpCategory ? wpCategory.name : 'Unknown';

      process.stdout.write(`\n📝 [${imported + 1}/${limit}] [${catName}] ${stripHtml(post.title.rendered).substring(0, 40)}... `);

      const result = await importArticle(post);

      if (result.success) {
        console.log(' ✅');
        imported++;
      } else {
        console.log(' ❌', result.error.message || 'Ошибка');
        failed++;
      }

      // Задержка
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    page++;

    if (page > totalPages) {
      break;
    }
  }

  console.log('\n=====================================');
  console.log(`✅ Импортировано: ${imported}`);
  console.log(`❌ Ошибок: ${failed}`);
  console.log('=====================================\n');
}

main().catch(console.error);
