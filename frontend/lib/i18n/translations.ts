export type Lang = 'en' | 'tr';

export const translations = {
  en: {
    // Navbar
    nav_properties: 'Properties',
    nav_agents: 'Agents',
    nav_roommates: 'Roommates',
    nav_studios: 'Studios',
    nav_1plus1: '1+1 Apartments',
    nav_2plus1: '2+1 Apartments',
    nav_all_properties: 'All Properties',
    nav_browse_agents: 'Browse Agents',
    nav_top_rated: 'Top Rated',
    nav_verified_agencies: 'Verified Agencies',
    nav_find_roommate: 'Find a Roommate',
    nav_roommate_settings: 'Roommate Settings',
    nav_login: 'Log in',
    nav_signup: 'Sign Up',
    nav_profile: 'Profile',
    nav_post_listing: 'Post Listing',
    nav_dashboard: 'Dashboard',

    // Homepage
    hero_title: 'Find a home you can actually afford today.',
    hero_subtitle: 'Discover premium spaces with transparent upfront move-in costs. Verified agents, compatible roommates, zero surprises.',
    hero_search_placeholder: "Try 'Kyrenia 2+1 under £600'...",
    hero_search_btn: 'Search',
    recently_added: 'Recently Added',
    recently_added_sub: 'Discover the newest properties on the market.',
    view_all: 'View All',
    by_university: 'Browse by University',
    trending: 'Trending Properties',
    trending_sub: 'Properties that are getting the most attention right now.',
    top_agents: 'Top Verified Agents',
    top_agents_sub: 'Work with the best real estate professionals in North Cyprus.',
    how_it_works: 'How It Works',
    how_sub: 'Your journey to the perfect home in North Cyprus made simple and secure.',
    step1_title: '1. Search',
    step1_desc: 'Find exactly what you\'re looking for with our advanced filters and university proximity tools.',
    step2_title: '2. Connect',
    step2_desc: 'Message verified agents directly or find roommates through our trusted platform.',
    step3_title: '3. Move In',
    step3_desc: 'Secure your ideal home with transparent move-in costs and clear rental terms.',

    // Search
    search_results: 'Search Results',
    properties: 'properties',
    recommended: 'Recommended',
    price_low: 'Price: Low to High',
    price_high: 'Price: High to Low',
    newest: 'Newest First',
    no_properties: 'No properties found yet.',
    no_properties_sub: 'Be the first to list a property or check back soon.',

    // Agents
    agents_title: 'Find a Verified Agent',
    agents_sub: 'Work with trusted professionals who know the North Cyprus housing market.',
    no_agents: 'No agents yet.',
    no_agents_sub: 'Agents will appear here once they sign up and verify.',

    // Common
    loading: 'Loading...',
    verified: 'Verified',
    per_month: '/mo',
  },

  tr: {
    // Navbar
    nav_properties: 'Mülkler',
    nav_agents: 'Emlakçılar',
    nav_roommates: 'Oda Arkadaşı',
    nav_studios: 'Stüdyolar',
    nav_1plus1: '1+1 Daireler',
    nav_2plus1: '2+1 Daireler',
    nav_all_properties: 'Tüm Mülkler',
    nav_browse_agents: 'Emlakçılara Bak',
    nav_top_rated: 'En Yüksek Puan',
    nav_verified_agencies: 'Onaylı Ajanslar',
    nav_find_roommate: 'Oda Arkadaşı Bul',
    nav_roommate_settings: 'Oda Arkadaşı Ayarları',
    nav_login: 'Giriş Yap',
    nav_signup: 'Kayıt Ol',
    nav_profile: 'Profil',
    nav_post_listing: 'İlan Ver',
    nav_dashboard: 'Yönetim Paneli',

    // Homepage
    hero_title: 'Bugün gerçekten karşılayabileceğin bir ev bul.',
    hero_subtitle: 'Şeffaf taşınma maliyetleriyle premium mekanlar. Onaylı emlakçılar, uyumlu oda arkadaşları, sıfır sürpriz.',
    hero_search_placeholder: "'Girne 2+1 £600 altı' gibi ara...",
    hero_search_btn: 'Ara',
    recently_added: 'Yeni Eklenenler',
    recently_added_sub: 'Piyasadaki en yeni mülkleri keşfedin.',
    view_all: 'Tümünü Gör',
    by_university: 'Üniversiteye Göre',
    trending: 'Trend Mülkler',
    trending_sub: 'Şu anda en çok ilgi gören mülkler.',
    top_agents: 'En İyi Onaylı Emlakçılar',
    top_agents_sub: 'Kuzey Kıbrıs konut piyasasını en iyi bilen profesyonellerle çalışın.',
    how_it_works: 'Nasıl Çalışır',
    how_sub: 'Kuzey Kıbrıs\'ta mükemmel eve giden yolculuğunuz basit ve güvenli.',
    step1_title: '1. Ara',
    step1_desc: 'Gelişmiş filtreler ve üniversiteye yakınlık araçlarıyla tam aradığınızı bulun.',
    step2_title: '2. Bağlan',
    step2_desc: 'Onaylı emlakçılara doğrudan mesaj gönderin veya güvenilir platformumuzda oda arkadaşı bulun.',
    step3_title: '3. Taşın',
    step3_desc: 'Şeffaf taşınma maliyetleri ve net kira koşullarıyla ideal evinizi güvence altına alın.',

    // Search
    search_results: 'Arama Sonuçları',
    properties: 'mülk',
    recommended: 'Önerilen',
    price_low: 'Fiyat: Düşükten Yükseğe',
    price_high: 'Fiyat: Yüksekten Düşüğe',
    newest: 'En Yeni',
    no_properties: 'Henüz mülk bulunamadı.',
    no_properties_sub: 'İlk ilanı siz verin veya daha sonra tekrar kontrol edin.',

    // Agents
    agents_title: 'Onaylı Emlakçı Bul',
    agents_sub: 'Kuzey Kıbrıs konut piyasasını iyi bilen güvenilir profesyonellerle çalışın.',
    no_agents: 'Henüz emlakçı yok.',
    no_agents_sub: 'Emlakçılar kaydolup doğruladıktan sonra burada görünecek.',

    // Common
    loading: 'Yükleniyor...',
    verified: 'Onaylı',
    per_month: '/ay',
  }
} as const;

export type TranslationKey = keyof typeof translations['en'];
