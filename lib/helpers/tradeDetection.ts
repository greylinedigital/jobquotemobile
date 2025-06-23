// Enhanced trade detection system for Australian sole traders
export interface TradeCategory {
  category: string;
  subcategory: string;
  keywords: string[];
  defaultHourlyRate: number;
  commonItems: string[];
  compliance?: string;
}

export const TRADE_CATEGORIES: TradeCategory[] = [
  // 🔌 Electrical & Data
  {
    category: 'electrical',
    subcategory: 'residential_electrician',
    keywords: ['electrical', 'electrician', 'wiring', 'power', 'lights', 'lighting', 'outlet', 'socket', 'powerpoint', 'gpo', 'switchboard', 'rcd', 'safety switch', 'downlight', 'led'],
    defaultHourlyRate: 120,
    commonItems: ['Electrical labour', 'Cable and wiring', 'Power outlets', 'Light fittings', 'Safety switches'],
    compliance: 'AS/NZS 3000 electrical standards'
  },
  {
    category: 'electrical',
    subcategory: 'data_cabling',
    keywords: ['data cabling', 'network', 'ethernet', 'cat6', 'cat5', 'internet', 'wifi', 'router', 'modem'],
    defaultHourlyRate: 110,
    commonItems: ['Data cabling installation', 'Network points', 'Patch panels', 'Cable testing'],
    compliance: 'AS/CA S008 cabling standards'
  },
  {
    category: 'electrical',
    subcategory: 'solar_installer',
    keywords: ['solar', 'panels', 'inverter', 'battery', 'renewable', 'grid tie', 'off grid'],
    defaultHourlyRate: 130,
    commonItems: ['Solar panel installation', 'Inverter setup', 'Battery system', 'Grid connection'],
    compliance: 'Clean Energy Council standards'
  },
  {
    category: 'electrical',
    subcategory: 'ev_charger',
    keywords: ['ev charger', 'electric vehicle', 'car charger', 'tesla', 'charging station'],
    defaultHourlyRate: 125,
    commonItems: ['EV charger installation', 'Electrical upgrade', 'Dedicated circuit'],
    compliance: 'AS/NZS 3000 EV charging standards'
  },

  // 🚿 Plumbing & Gas
  {
    category: 'plumbing',
    subcategory: 'maintenance_plumber',
    keywords: ['plumbing', 'plumber', 'pipes', 'water', 'drainage', 'leak', 'tap', 'toilet', 'shower', 'basin', 'faucet', 'mixer'],
    defaultHourlyRate: 110,
    commonItems: ['Plumbing labour', 'Pipe fittings', 'Taps and mixers', 'Toilet repairs'],
    compliance: 'AS/NZS 3500 plumbing standards'
  },
  {
    category: 'plumbing',
    subcategory: 'gas_fitter',
    keywords: ['gas', 'gas fitting', 'gas line', 'gas appliance', 'gas heater', 'gas stove', 'gas hot water'],
    defaultHourlyRate: 120,
    commonItems: ['Gas line installation', 'Gas appliance connection', 'Gas safety testing'],
    compliance: 'AS/NZS 5601 gas installation standards'
  },
  {
    category: 'plumbing',
    subcategory: 'hot_water_installer',
    keywords: ['hot water', 'water heater', 'instantaneous', 'storage', 'gas hot water', 'electric hot water'],
    defaultHourlyRate: 115,
    commonItems: ['Hot water system', 'Installation labour', 'Pipe connections', 'Gas/electrical connections'],
    compliance: 'AS/NZS 3500 hot water standards'
  },

  // 🪚 Building, Carpentry, and Renovations
  {
    category: 'carpentry',
    subcategory: 'carpenter',
    keywords: ['carpenter', 'carpentry', 'timber', 'wood', 'framing', 'decking', 'pergola', 'shed', 'deck'],
    defaultHourlyRate: 95,
    commonItems: ['Carpentry labour', 'Timber materials', 'Hardware and fixings', 'Structural work'],
    compliance: 'Australian Building Code'
  },
  {
    category: 'handyman',
    subcategory: 'general_handyman',
    keywords: ['handyman', 'maintenance', 'repair', 'fix', 'install', 'mount', 'hang', 'general repairs', 'shelf', 'shelves', 'floating shelf'],
    defaultHourlyRate: 85,
    commonItems: ['Handyman labour', 'General materials', 'Hardware and fixings', 'Minor repairs'],
    compliance: 'General building standards'
  },
  {
    category: 'renovation',
    subcategory: 'kitchen_installer',
    keywords: ['kitchen', 'kitchen renovation', 'kitchen install', 'cabinetry', 'benchtop', 'splashback'],
    defaultHourlyRate: 100,
    commonItems: ['Kitchen installation', 'Cabinetry', 'Benchtops', 'Hardware and fittings'],
    compliance: 'Australian Building Code'
  },
  {
    category: 'renovation',
    subcategory: 'bathroom_installer',
    keywords: ['bathroom', 'bathroom renovation', 'ensuite', 'vanity', 'shower screen', 'tiles', 'shower caddy', 'towel rail'],
    defaultHourlyRate: 105,
    commonItems: ['Bathroom renovation', 'Tiling work', 'Waterproofing', 'Fixtures and fittings'],
    compliance: 'AS 3740 waterproofing standards'
  },

  // 🎨 Painting & Surface Prep
  {
    category: 'painting',
    subcategory: 'interior_painter',
    keywords: ['painting', 'painter', 'interior', 'walls', 'ceiling', 'primer', 'paint'],
    defaultHourlyRate: 75,
    commonItems: ['Painting labour', 'Paint and primer', 'Surface preparation', 'Brushes and rollers'],
    compliance: 'Australian paint standards'
  },
  {
    category: 'painting',
    subcategory: 'exterior_painter',
    keywords: ['exterior painting', 'house painting', 'weatherboard', 'render', 'fence painting'],
    defaultHourlyRate: 80,
    commonItems: ['Exterior painting', 'Weather-resistant paint', 'Surface preparation', 'Scaffolding'],
    compliance: 'Weather protection standards'
  },

  // 🌿 Landscaping & Outdoors
  {
    category: 'landscaping',
    subcategory: 'landscaper',
    keywords: ['landscaping', 'garden', 'plants', 'irrigation', 'retaining wall', 'paving', 'turf'],
    defaultHourlyRate: 85,
    commonItems: ['Landscaping labour', 'Plants and materials', 'Irrigation components', 'Soil and mulch'],
    compliance: 'Horticulture standards'
  },
  {
    category: 'landscaping',
    subcategory: 'lawn_mowing',
    keywords: ['lawn mowing', 'grass cutting', 'hedge trimming', 'garden maintenance'],
    defaultHourlyRate: 60,
    commonItems: ['Lawn mowing service', 'Garden maintenance', 'Green waste removal'],
    compliance: 'Garden maintenance standards'
  },
  {
    category: 'fencing',
    subcategory: 'fencer',
    keywords: ['fencing', 'fence', 'gate', 'colorbond', 'timber fence', 'pool fence'],
    defaultHourlyRate: 90,
    commonItems: ['Fencing materials', 'Posts and rails', 'Gates and hardware', 'Installation labour'],
    compliance: 'AS 1926 swimming pool fencing'
  },

  // 🧱 Concrete & Driveway
  {
    category: 'concrete',
    subcategory: 'concreter',
    keywords: ['concrete', 'concreting', 'driveway', 'slab', 'footpath', 'exposed aggregate'],
    defaultHourlyRate: 95,
    commonItems: ['Concrete supply', 'Reinforcement', 'Formwork', 'Finishing labour'],
    compliance: 'AS 3600 concrete structures'
  },
  {
    category: 'paving',
    subcategory: 'paver',
    keywords: ['paving', 'pavers', 'brick paving', 'stone paving', 'driveway paving'],
    defaultHourlyRate: 85,
    commonItems: ['Paving materials', 'Sand and cement', 'Edge restraints', 'Installation labour'],
    compliance: 'Paving installation standards'
  },

  // 🪵 Tiling & Flooring
  {
    category: 'tiling',
    subcategory: 'tiler',
    keywords: ['tiling', 'tiles', 'floor tiles', 'wall tiles', 'bathroom tiles', 'kitchen tiles'],
    defaultHourlyRate: 90,
    commonItems: ['Tiles and materials', 'Adhesive and grout', 'Waterproofing', 'Tiling labour'],
    compliance: 'AS 3958 tiling standards'
  },
  {
    category: 'flooring',
    subcategory: 'floor_installer',
    keywords: ['flooring', 'laminate', 'timber floor', 'vinyl', 'carpet', 'floor installation'],
    defaultHourlyRate: 85,
    commonItems: ['Flooring materials', 'Underlay', 'Installation labour', 'Finishing trim'],
    compliance: 'Flooring installation standards'
  },

  // 🏠 Roofing & Guttering
  {
    category: 'roofing',
    subcategory: 'roofer',
    keywords: ['roofing', 'roof', 'tiles', 'metal roof', 'colorbond', 'roof repair', 'guttering'],
    defaultHourlyRate: 100,
    commonItems: ['Roofing materials', 'Guttering', 'Flashing', 'Installation labour'],
    compliance: 'AS 1562 roofing standards'
  },

  // ❄️ Heating, Cooling & Air Systems
  {
    category: 'hvac',
    subcategory: 'aircon_installer',
    keywords: ['air conditioning', 'aircon', 'split system', 'ducted', 'heating', 'cooling'],
    defaultHourlyRate: 115,
    commonItems: ['Air conditioning unit', 'Installation labour', 'Refrigerant', 'Electrical connections'],
    compliance: 'Refrigeration handling license'
  },

  // 🪟 Windows & Glazing
  {
    category: 'glazing',
    subcategory: 'glazier',
    keywords: ['glass', 'glazing', 'windows', 'shower screen', 'splashback', 'mirror'],
    defaultHourlyRate: 95,
    commonItems: ['Glass materials', 'Installation labour', 'Sealants', 'Hardware'],
    compliance: 'AS 1288 glass standards'
  },

  // 🔒 Security & Access
  {
    category: 'security',
    subcategory: 'locksmith',
    keywords: ['locksmith', 'locks', 'security', 'deadlock', 'door lock', 'safe'],
    defaultHourlyRate: 110,
    commonItems: ['Lock hardware', 'Installation labour', 'Key cutting', 'Security assessment'],
    compliance: 'Security installation standards'
  },
  {
    category: 'security',
    subcategory: 'cctv_installer',
    keywords: ['cctv', 'security camera', 'surveillance', 'alarm system', 'security system'],
    defaultHourlyRate: 105,
    commonItems: ['CCTV equipment', 'Cabling', 'Installation labour', 'System setup'],
    compliance: 'Security equipment standards'
  },

  // 🧼 Cleaning & Maintenance
  {
    category: 'cleaning',
    subcategory: 'pressure_washing',
    keywords: ['pressure washing', 'pressure cleaning', 'driveway cleaning', 'house washing'],
    defaultHourlyRate: 70,
    commonItems: ['Pressure washing service', 'Cleaning chemicals', 'Equipment hire'],
    compliance: 'Environmental cleaning standards'
  },

  // 🚗 Custom Automotive Trades
  {
    category: 'automotive',
    subcategory: 'auto_electrician',
    keywords: ['auto electrician', 'car electrical', 'dual battery', 'dash cam', 'uhf radio', 'trailer wiring'],
    defaultHourlyRate: 120,
    commonItems: ['Auto electrical labour', 'Wiring and cables', 'Switches and fuses', 'Electrical components'],
    compliance: 'Automotive electrical standards'
  },
  {
    category: 'automotive',
    subcategory: 'fourwd_modifier',
    keywords: ['4wd', 'light bar', 'winch', 'bull bar', 'canopy', 'drawers', 'redarc', 'victron'],
    defaultHourlyRate: 110,
    commonItems: ['4WD accessories', 'Installation labour', 'Wiring and mounting', 'Custom fabrication'],
    compliance: 'Vehicle modification standards'
  },
  {
    category: 'automotive',
    subcategory: 'mobile_mechanic',
    keywords: ['mobile mechanic', 'car service', 'brake repair', 'suspension', 'exhaust', 'tune up'],
    defaultHourlyRate: 100,
    commonItems: ['Mechanical labour', 'Parts and components', 'Fluids and filters', 'Diagnostic testing'],
    compliance: 'Automotive repair standards'
  }
];

export function detectJobType(description: string): TradeCategory | null {
  const lowerDesc = description.toLowerCase();
  
  // Score each trade category based on keyword matches
  const scores = TRADE_CATEGORIES.map(trade => {
    const matchCount = trade.keywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    ).length;
    
    // Weight exact matches higher
    const exactMatches = trade.keywords.filter(keyword => {
      const keywordLower = keyword.toLowerCase();
      return lowerDesc === keywordLower || 
             lowerDesc.includes(' ' + keywordLower + ' ') ||
             lowerDesc.startsWith(keywordLower + ' ') ||
             lowerDesc.endsWith(' ' + keywordLower);
    }).length;
    
    return {
      trade,
      score: matchCount + (exactMatches * 2), // Bonus for exact matches
      exactMatch: exactMatches > 0
    };
  });
  
  // Sort by score (descending) and return the best match
  scores.sort((a, b) => {
    if (a.exactMatch && !b.exactMatch) return -1;
    if (!a.exactMatch && b.exactMatch) return 1;
    return b.score - a.score;
  });
  
  // Return the best match if it has at least one keyword match
  return scores[0]?.score > 0 ? scores[0].trade : null;
}

export function generateTradeSpecificItems(
  description: string, 
  tradeCategory: TradeCategory,
  userHourlyRate?: number // Add optional user hourly rate parameter
): Array<{name: string, type: string, qty: number, cost: number}> {
  const items = [];
  const lowerDesc = description.toLowerCase();
  
  // Use user's hourly rate if provided, otherwise use trade default
  const hourlyRate = userHourlyRate || tradeCategory.defaultHourlyRate;
  
  // Add labour based on trade category
  const estimatedHours = estimateLabourHours(description, tradeCategory);
  items.push({
    name: `Professional ${tradeCategory.subcategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Service`,
    type: 'labour',
    qty: estimatedHours,
    cost: hourlyRate // Use the user's rate or trade default
  });
  
  // Add trade-specific materials and services
  switch (tradeCategory.category) {
    case 'electrical':
      items.push(...generateElectricalItems(description, tradeCategory));
      break;
    case 'plumbing':
      items.push(...generatePlumbingItems(description, tradeCategory));
      break;
    case 'carpentry':
    case 'handyman':
    case 'renovation':
      items.push(...generateCarpentryItems(description, tradeCategory));
      break;
    case 'painting':
      items.push(...generatePaintingItems(description, tradeCategory));
      break;
    case 'landscaping':
    case 'fencing':
      items.push(...generateLandscapingItems(description, tradeCategory));
      break;
    case 'concrete':
    case 'paving':
      items.push(...generateConcreteItems(description, tradeCategory));
      break;
    case 'automotive':
      items.push(...generateAutomotiveItems(description, tradeCategory));
      break;
    default:
      // Generic materials for other trades
      items.push({
        name: 'Materials and Supplies',
        type: 'materials',
        qty: 1,
        cost: Math.round(estimatedHours * 30) // Reasonable material cost
      });
  }
  
  // Add call-out fee for smaller jobs
  if (estimatedHours < 2) {
    items.push({
      name: 'Service Call-Out Fee',
      type: 'other',
      qty: 1,
      cost: 65
    });
  }
  
  // Add compliance/testing if required for regulated trades
  if (tradeCategory.compliance && (
    tradeCategory.category === 'electrical' || 
    tradeCategory.category === 'plumbing'
  )) {
    items.push({
      name: 'Testing & Compliance',
      type: 'other',
      qty: 1,
      cost: 85
    });
  }
  
  return items;
}

function estimateLabourHours(description: string, tradeCategory: TradeCategory): number {
  const lowerDesc = description.toLowerCase();
  let baseHours = 2; // Minimum reasonable time
  
  // Extract quantities from description
  const quantityMatch = description.match(/(\d+)/);
  const quantity = quantityMatch ? Math.min(parseInt(quantityMatch[1]), 20) : 1; // Cap at 20 for sanity
  
  // Adjust based on trade type and keywords
  switch (tradeCategory.category) {
    case 'electrical':
      if (lowerDesc.includes('power point') || lowerDesc.includes('outlet')) {
        baseHours = Math.max(1.5, quantity * 0.5);
      } else if (lowerDesc.includes('light') || lowerDesc.includes('downlight')) {
        baseHours = Math.max(2, quantity * 0.3);
      } else if (lowerDesc.includes('switchboard')) {
        baseHours = 4;
      } else if (lowerDesc.includes('rewire')) {
        baseHours = 8;
      }
      break;
      
    case 'plumbing':
      if (lowerDesc.includes('tap') || lowerDesc.includes('mixer')) {
        baseHours = Math.max(1, quantity * 0.5);
      } else if (lowerDesc.includes('toilet')) {
        baseHours = 2;
      } else if (lowerDesc.includes('hot water')) {
        baseHours = 4;
      }
      break;
      
    case 'automotive':
      if (lowerDesc.includes('dual battery')) {
        baseHours = 6;
      } else if (lowerDesc.includes('light bar')) {
        baseHours = 3;
      } else if (lowerDesc.includes('dash cam')) {
        baseHours = 2;
      } else if (lowerDesc.includes('uhf')) {
        baseHours = 2.5;
      }
      break;
      
    case 'handyman':
      if (lowerDesc.includes('shelf') || lowerDesc.includes('shelves')) {
        baseHours = Math.max(1, quantity * 0.5);
      } else if (lowerDesc.includes('mount') || lowerDesc.includes('hang')) {
        baseHours = 1.5;
      }
      break;
      
    case 'renovation':
      if (lowerDesc.includes('bathroom')) {
        baseHours = 16; // Major renovation
      } else if (lowerDesc.includes('kitchen')) {
        baseHours = 20; // Major renovation
      }
      break;
      
    default:
      // Scale with quantity but keep reasonable
      baseHours = Math.max(2, Math.min(quantity * 0.5, 8));
  }
  
  return Math.round(baseHours * 2) / 2; // Round to nearest 0.5 hour
}

function generateElectricalItems(description: string, tradeCategory: TradeCategory) {
  const items = [];
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('power point') || lowerDesc.includes('outlet')) {
    const quantity = extractQuantity(description, ['power point', 'outlet', 'powerpoint']) || 2;
    items.push({
      name: 'Power Outlet & Materials',
      type: 'materials',
      qty: quantity,
      cost: 55
    });
  } else if (lowerDesc.includes('light') || lowerDesc.includes('downlight')) {
    const quantity = extractQuantity(description, ['light', 'downlight', 'led']) || 6;
    items.push({
      name: 'LED Downlights & Wiring',
      type: 'materials',
      qty: quantity,
      cost: 45
    });
  } else if (lowerDesc.includes('switchboard')) {
    items.push({
      name: 'Switchboard Components',
      type: 'materials',
      qty: 1,
      cost: 350
    });
  } else {
    // Generic electrical materials
    items.push({
      name: 'Electrical Components',
      type: 'materials',
      qty: 1,
      cost: 120
    });
  }
  
  return items;
}

function generatePlumbingItems(description: string, tradeCategory: TradeCategory) {
  const items = [];
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('tap') || lowerDesc.includes('mixer')) {
    items.push({
      name: 'Tap & Fittings',
      type: 'materials',
      qty: 1,
      cost: 180
    });
  } else if (lowerDesc.includes('toilet')) {
    items.push({
      name: 'Toilet Suite & Installation Kit',
      type: 'materials',
      qty: 1,
      cost: 320
    });
  } else if (lowerDesc.includes('hot water')) {
    items.push({
      name: 'Hot Water System',
      type: 'materials',
      qty: 1,
      cost: 850
    });
  } else {
    // Generic plumbing materials
    items.push({
      name: 'Plumbing Materials',
      type: 'materials',
      qty: 1,
      cost: 150
    });
  }
  
  return items;
}

function generateCarpentryItems(description: string, tradeCategory: TradeCategory) {
  const items = [];
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('deck')) {
    items.push({
      name: 'Decking Materials & Hardware',
      type: 'materials',
      qty: 1,
      cost: 450
    });
  } else if (lowerDesc.includes('shelf') || lowerDesc.includes('shelves')) {
    const quantity = extractQuantity(description, ['shelf', 'shelves']) || 2;
    items.push({
      name: 'Shelf & Mounting Hardware',
      type: 'materials',
      qty: quantity,
      cost: 35
    });
  } else if (lowerDesc.includes('kitchen')) {
    items.push({
      name: 'Kitchen Installation Materials',
      type: 'materials',
      qty: 1,
      cost: 800
    });
  } else if (lowerDesc.includes('bathroom')) {
    items.push({
      name: 'Bathroom Renovation Materials',
      type: 'materials',
      qty: 1,
      cost: 650
    });
  } else {
    // Generic carpentry materials
    items.push({
      name: 'Timber & Hardware',
      type: 'materials',
      qty: 1,
      cost: 180
    });
  }
  
  return items;
}

function generatePaintingItems(description: string, tradeCategory: TradeCategory) {
  const items = [];
  
  items.push({
    name: 'Paint & Materials',
    type: 'materials',
    qty: 1,
    cost: 180
  });
  
  return items;
}

function generateLandscapingItems(description: string, tradeCategory: TradeCategory) {
  const items = [];
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('fence')) {
    items.push({
      name: 'Fencing Materials',
      type: 'materials',
      qty: 1,
      cost: 450
    });
  } else if (lowerDesc.includes('garden') || lowerDesc.includes('plant')) {
    items.push({
      name: 'Plants & Garden Materials',
      type: 'materials',
      qty: 1,
      cost: 250
    });
  } else {
    items.push({
      name: 'Landscaping Materials',
      type: 'materials',
      qty: 1,
      cost: 200
    });
  }
  
  return items;
}

function generateConcreteItems(description: string, tradeCategory: TradeCategory) {
  const items = [];
  
  items.push({
    name: 'Concrete & Materials',
    type: 'materials',
    qty: 1,
    cost: 380
  });
  
  return items;
}

function generateAutomotiveItems(description: string, tradeCategory: TradeCategory) {
  const items = [];
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('dual battery')) {
    items.push({
      name: 'Dual Battery System Kit',
      type: 'materials',
      qty: 1,
      cost: 750
    });
  } else if (lowerDesc.includes('light bar')) {
    items.push({
      name: 'LED Light Bar & Wiring Kit',
      type: 'materials',
      qty: 1,
      cost: 320
    });
  } else if (lowerDesc.includes('dash cam')) {
    items.push({
      name: 'Dash Camera & Installation Kit',
      type: 'materials',
      qty: 1,
      cost: 280
    });
  } else if (lowerDesc.includes('uhf')) {
    items.push({
      name: 'UHF Radio & Antenna Kit',
      type: 'materials',
      qty: 1,
      cost: 250
    });
  } else {
    items.push({
      name: 'Automotive Parts & Materials',
      type: 'materials',
      qty: 1,
      cost: 200
    });
  }
  
  return items;
}

function extractQuantity(description: string, keywords: string[]): number | null {
  // Look for numbers before keywords
  for (const keyword of keywords) {
    const patterns = [
      new RegExp(`(\\d+)\\s*${keyword}`, 'i'),
      new RegExp(`(\\d+)\\s*x\\s*${keyword}`, 'i'),
      new RegExp(`(\\d+)\\s*${keyword.replace(' ', '\\s*')}`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const qty = parseInt(match[1]);
        return Math.min(qty, 20); // Cap at 20 for sanity
      }
    }
  }
  
  // Look for standalone numbers at the beginning
  const leadingNumber = description.match(/^(\d+)/);
  if (leadingNumber) {
    const qty = parseInt(leadingNumber[1]);
    return Math.min(qty, 20);
  }
  
  return null;
}

export function generateProfessionalSummary(
  description: string, 
  tradeCategory: TradeCategory
): string {
  const businessType = tradeCategory.subcategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Keep summaries concise and professional
  const summaryTemplates = {
    electrical: [
      `Professional electrical installation completed to Australian standards with quality materials and expert workmanship.`,
      `Expert electrical work with comprehensive testing and compliance certification for safety and reliability.`,
      `Quality electrical service using premium components and professional techniques, fully compliant with regulations.`
    ],
    plumbing: [
      `Professional plumbing service completed to Australian standards with quality materials and warranty coverage.`,
      `Expert plumbing installation with proper testing and compliance for long-lasting, reliable operation.`,
      `Quality plumbing work using premium materials and professional techniques, fully guaranteed.`
    ],
    automotive: [
      `Professional automotive installation using quality brands with expert workmanship and attention to detail.`,
      `Custom automotive modification service with premium components and professional installation.`,
      `Mobile automotive service with quality parts and expert installation, completed to industry standards.`
    ],
    carpentry: [
      `Professional carpentry work using quality materials and traditional techniques, built to last.`,
      `Expert timber work with attention to detail and quality craftsmanship, completed to building standards.`,
      `Quality carpentry service using premium materials and professional techniques with warranty.`
    ],
    handyman: [
      `Professional handyman service with quality workmanship and attention to detail.`,
      `Expert installation and repair work completed to high standards with quality materials.`,
      `Reliable handyman service with professional results and customer satisfaction guaranteed.`
    ],
    default: [
      `Professional ${businessType.toLowerCase()} service completed to industry standards with quality workmanship.`,
      `Expert ${businessType.toLowerCase()} work with attention to detail and quality results, fully guaranteed.`,
      `Quality ${businessType.toLowerCase()} service using premium materials and professional techniques.`
    ]
  };
  
  const templates = summaryTemplates[tradeCategory.category] || summaryTemplates.default;
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return randomTemplate;
}