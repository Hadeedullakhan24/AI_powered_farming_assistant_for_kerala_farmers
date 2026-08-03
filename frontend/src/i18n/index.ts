import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import ml from '../locales/ml.json'
import hi from '../locales/hi.json'
import ta from '../locales/ta.json'

const savedLang = localStorage.getItem('hk_lang') ?? 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ml: { translation: ml },
      hi: { translation: hi },
      ta: { translation: ta },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

// sync html lang attribute
document.documentElement.lang = savedLang

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('hk_lang', lng)
  document.documentElement.lang = lng
})

export default i18n
