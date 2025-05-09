// src/config/i18n.ts

import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';

/**
 * Initialize and configure i18next for internationalization (i18n)
 */
i18next
    .use(Backend)                      // Load translations from filesystem
    .use(middleware.LanguageDetector) // Detect user language (query, cookie, header)
    .init({
        fallbackLng: 'en',              // Default language if detection fails
        preload: ['en', 'es'],          // Preload these languages
        backend: {
            // Path to translation files
            loadPath: path.join(__dirname, '../locales/{{lng}}/translation.json'),
        },
        detection: {
            order: ['querystring', 'cookie', 'header'], // Detection order
            caches: ['cookie'],                         // Cache users’ language selection in cookie
        },
        debug: false,                  // Turn on for debugging i18n issues
    });

export default i18next;
