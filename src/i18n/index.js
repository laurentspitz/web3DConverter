import en_US from './en_US.js';
import fr_FR from './fr_FR.js';
import es_ES from './es_ES.js';
import de_DE from './de_DE.js';
import it_IT from './it_IT.js';
import pt_PT from './pt_PT.js';
import nl_NL from './nl_NL.js';
import ru_RU from './ru_RU.js';
import zh_CN from './zh_CN.js';
import ja_JP from './ja_JP.js';

const languages = {
    en: en_US,
    fr: fr_FR,
    es: es_ES,
    de: de_DE,
    it: it_IT,
    pt: pt_PT,
    nl: nl_NL,
    ru: ru_RU,
    zh: zh_CN,
    ja: ja_JP
};

const translations = {};

// Build translations with fallback to en_US
Object.keys(languages).forEach(lang => {
    // If not English, merge with English to provide fallback for missing keys
    if (lang !== 'en') {
        translations[lang] = { ...en_US, ...languages[lang] };
    } else {
        translations[lang] = en_US;
    }
});

export default translations;
