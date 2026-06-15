/**
 * Data utility functions for Lead Outreach Assistant
 */

/**
 * Validate Indian mobile phone number
 * Accepts formats: 10-digit, +91, 91 prefix
 */
export function validatePhone(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[\s\-().]/g, '');
  // Extract last 10 digits if prefixed with 91 or +91
  const match = cleaned.match(/(?:\+?91)?([6-9]\d{9})$/);
  if (match) return match[1];
  return null;
}

/**
 * Normalize phone to display format: +91 XXXXX XXXXX
 */
export function formatPhone(phone10) {
  if (!phone10) return '';
  return `+91 ${phone10.slice(0, 5)} ${phone10.slice(5)}`;
}

/**
 * Clean and deduplicate raw leads from Excel
 * @param {Array} rawRows - array of row objects from xlsx
 * @returns {{ leads, stats }}
 */
export function cleanLeads(rawRows) {
  const stats = {
    total: rawRows.length,
    blankPhone: 0,
    invalidPhone: 0,
    duplicatePhone: 0,
    imported: 0,
  };

  const seen = new Set();
  const leads = [];

  for (const row of rawRows) {
    const businessName = String(row.A || row['Business Name'] || '').trim();
    const rawPhone = row.I || row['Phone Number'] || '';
    const category = String(row.J || row['Category'] || '').trim();

    if (!rawPhone || String(rawPhone).trim() === '') {
      stats.blankPhone++;
      continue;
    }

    const phone = validatePhone(rawPhone);
    if (!phone) {
      stats.invalidPhone++;
      continue;
    }

    if (seen.has(phone)) {
      stats.duplicatePhone++;
      continue;
    }

    seen.add(phone);

    leads.push({
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      businessName: businessName || 'Unknown Business',
      phone,
      phoneDisplay: formatPhone(phone),
      category: category || 'General',
      city: extractCity(category, businessName),
      status: 'New',
      contactedAt: null,
      repliedAt: null,
      notes: '',
      followUpDate: null,
      importedAt: new Date().toISOString(),
      selectedLanguage: '',
      repliedLanguage: '',
      messageHistory: [],
    });
    stats.imported++;
  }

  return { leads, stats };
}

/**
 * Attempt to extract a city from category or business name
 */
function extractCity(category, businessName) {
  const combined = `${category} ${businessName}`.toLowerCase();
  const cities = [
    'hyderabad', 'secunderabad', 'warangal', 'nizamabad', 'karimnagar',
    'khammam', 'ramagundam', 'mahbubnagar', 'nalgonda', 'adilabad',
    'visakhapatnam', 'vijayawada', 'guntur', 'nellore', 'kurnool',
    'tirupati', 'kadapa', 'anantapur', 'eluru', 'ongole',
    'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'pune', 'ahmedabad',
  ];
  for (const city of cities) {
    if (combined.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return '';
}

/**
 * Generate personalized outreach message based on language
 */
export function generateMessage(businessName, language = 'Multilingual') {
  const contacts = `📞 Contact Us:

Praveen: +91 7671030259
Dhanush: +91 9391899088
Varshith: +91 9440025408`;

  if (language === 'Telugu') {
    return `నమస్తే సార్/మేడం,

మీ వ్యాపారం ${businessName} కి ప్రత్యేక వెబ్సైట్ లేదని గమనించాము.

మేము మీ వ్యాపారం కోసం ఒక ప్రొఫెషనల్ వెబ్సైట్ ని క్రియేట్ చేసి, ఒక ఉచిత డెమోను చూపించగలము.

 మీకు ఆసక్తి ఉంటే దయచేసి రిప్లై ఇవ్వండి.

${contacts}`;
  }

  if (language === 'English') {
    return `Hello Sir/Madam,

We noticed that ${businessName} does not have a dedicated website.

We can create a professional website for your business and show you a FREE demo.

If you are interested, please reply.

${contacts}`;
  }

  if (language === 'Hindi') {
    return `नमस्ते सर/मैडम,

हमने ध्यान दिया कि आपके व्यवसाय ${businessName} की कोई समर्पित वेबसाइट नहीं है।

हम आपके व्यवसाय के लिए एक पेशेवर वेबसाइट बना सकते हैं और आपको एक मुफ़्त डेमो दिखा सकते हैं।

यदि आप रुचि रखते हैं, तो कृपया उत्तर दें।

${contacts}`;
  }

  // Multilingual template (default)
  return `🇮🇳 Telugu | English | हिंदी

Hello Sir/Madam,

We noticed that ${businessName} may not have a dedicated website.

మీ వ్యాపారానికి ప్రత్యేక వెబ్సైట్ లేదని గమనించాము.

हमें लगा कि आपके व्यवसाय की अपनी वेबसाइट नहीं है।

We can create a professional website and show a FREE demo.

Reply:
TELUGU | ENGLISH | HINDI

${contacts}`;
}


/**
 * Compute dashboard stats from leads array
 */
export function computeStats(leads) {
  const stats = {
    total: leads.length,
    newLeads: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    notInterested: 0,
    followUp: 0,
  };
  for (const lead of leads) {
    switch (lead.status) {
      case 'New': stats.newLeads++; break;
      case 'Contacted': stats.contacted++; break;
      case 'Replied': stats.replied++; break;
      case 'Interested': stats.interested++; break;
      case 'Not Interested': stats.notInterested++; break;
      case 'Follow-up Needed': stats.followUp++; break;
    }
  }
  return stats;
}

/**
 * Get unique categories from leads
 */
export function getCategories(leads) {
  return [...new Set(leads.map(l => l.category).filter(Boolean))].sort();
}

/**
 * Get unique cities from leads
 */
export function getCities(leads) {
  return [...new Set(leads.map(l => l.city).filter(Boolean))].sort();
}

export const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Replied',
  'Interested',
  'Not Interested',
  'Follow-up Needed',
];

export const STATUS_COLORS = {
  'New': '#6b7280',
  'Contacted': '#3b82f6',
  'Replied': '#8b5cf6',
  'Interested': '#10b981',
  'Not Interested': '#ef4444',
  'Follow-up Needed': '#f59e0b',
};

export const USERS = [
  'Praveen',
  'Dhanush',
  'Varshith',
  'sathwik',
  'ramteja'
];

