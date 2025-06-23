const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { job_description, client_email } = await req.json()

    // Enhanced trade detection for Australian sole traders
    const detectTradeType = (description: string): string => {
      const content = description.toLowerCase();
      
      // Electrical & Data
      if (content.includes('electrical') || content.includes('electrician') || content.includes('wiring') || content.includes('power') || content.includes('lights') || content.includes('outlet') || content.includes('switchboard')) return 'electrical';
      if (content.includes('data cabling') || content.includes('network') || content.includes('ethernet')) return 'data_cabling';
      if (content.includes('solar') || content.includes('panels') || content.includes('inverter')) return 'solar';
      if (content.includes('ev charger') || content.includes('electric vehicle')) return 'ev_charger';
      
      // Plumbing & Gas
      if (content.includes('plumbing') || content.includes('plumber') || content.includes('pipes') || content.includes('water') || content.includes('tap') || content.includes('toilet')) return 'plumbing';
      if (content.includes('gas') || content.includes('gas fitting')) return 'gas_fitting';
      if (content.includes('hot water') || content.includes('water heater')) return 'hot_water';
      
      // Building & Carpentry
      if (content.includes('carpenter') || content.includes('carpentry') || content.includes('timber') || content.includes('deck') || content.includes('pergola')) return 'carpentry';
      if (content.includes('handyman') || content.includes('maintenance') || content.includes('repair')) return 'handyman';
      if (content.includes('kitchen') && (content.includes('renovation') || content.includes('install'))) return 'kitchen_renovation';
      if (content.includes('bathroom') && (content.includes('renovation') || content.includes('install'))) return 'bathroom_renovation';
      
      // Painting
      if (content.includes('painting') || content.includes('painter') || content.includes('paint')) return 'painting';
      
      // Landscaping
      if (content.includes('landscaping') || content.includes('garden') || content.includes('plants')) return 'landscaping';
      if (content.includes('lawn mowing') || content.includes('grass cutting')) return 'lawn_mowing';
      if (content.includes('fencing') || content.includes('fence')) return 'fencing';
      
      // Concrete & Paving
      if (content.includes('concrete') || content.includes('concreting') || content.includes('driveway') || content.includes('slab')) return 'concrete';
      if (content.includes('paving') || content.includes('pavers')) return 'paving';
      
      // Tiling & Flooring
      if (content.includes('tiling') || content.includes('tiles')) return 'tiling';
      if (content.includes('flooring') || content.includes('laminate') || content.includes('timber floor')) return 'flooring';
      
      // Roofing
      if (content.includes('roofing') || content.includes('roof') || content.includes('guttering')) return 'roofing';
      
      // HVAC
      if (content.includes('air conditioning') || content.includes('aircon') || content.includes('split system')) return 'hvac';
      
      // Automotive
      if (content.includes('dual battery') || content.includes('auto electrician') || content.includes('car electrical')) return 'auto_electrical';
      if (content.includes('4wd') || content.includes('light bar') || content.includes('winch') || content.includes('bull bar')) return 'fourwd_modification';
      if (content.includes('mobile mechanic') || content.includes('car service')) return 'mobile_mechanic';
      if (content.includes('dash cam') || content.includes('uhf radio')) return 'auto_accessories';
      
      // Security & Access
      if (content.includes('locksmith') || content.includes('locks')) return 'locksmith';
      if (content.includes('cctv') || content.includes('security camera')) return 'security_systems';
      
      // Cleaning
      if (content.includes('pressure washing') || content.includes('pressure cleaning')) return 'pressure_washing';
      if (content.includes('cleaning') && content.includes('end of lease')) return 'end_of_lease_cleaning';
      
      // Windows & Glazing
      if (content.includes('glass') || content.includes('glazing') || content.includes('shower screen')) return 'glazing';
      
      return 'general_trade';
    };

    // Enhanced quote generation with trade-specific items
    const generateTradeQuote = (description: string, tradeType: string) => {
      const items = [];
      const lowerDesc = description.toLowerCase();
      
      // Base labour hours estimation
      let labourHours = 2;
      let hourlyRate = 95; // Default rate
      
      // Trade-specific pricing and items
      switch (tradeType) {
        case 'electrical':
          hourlyRate = 120;
          if (lowerDesc.includes('power point')) {
            const matches = description.match(/(\d+)\s*(double\s*)?power\s*point/i);
            const quantity = (matches && matches[1]) ? parseInt(matches[1]) : 2;
            labourHours = Math.max(1.5, quantity * 0.5);
            items.push({
              type: 'materials',
              name: 'Double Power Point Outlets',
              qty: quantity,
              cost: 45,
            });
            items.push({
              type: 'materials',
              name: 'Electrical Cable (2.5mm TPS)',
              qty: quantity * 5,
              cost: 4.50,
            });
          } else if (lowerDesc.includes('light') || lowerDesc.includes('downlight')) {
            const matches = description.match(/(\d+)\s*(led\s*)?(down)?light/i);
            const quantity = (matches && matches[1]) ? parseInt(matches[1]) : 6;
            labourHours = Math.max(2, quantity * 0.3);
            items.push({
              type: 'materials',
              name: 'LED Downlight Fittings (10W)',
              qty: quantity,
              cost: 35,
            });
          }
          break;
          
        case 'auto_electrical':
          hourlyRate = 120;
          if (lowerDesc.includes('dual battery')) {
            labourHours = 6;
            items.push({
              type: 'materials',
              name: 'Redarc BCDC Charger',
              qty: 1,
              cost: 450,
            });
            items.push({
              type: 'materials',
              name: 'AGM Deep Cycle Battery',
              qty: 1,
              cost: 320,
            });
            items.push({
              type: 'materials',
              name: 'Wiring & Fuses',
              qty: 1,
              cost: 85,
            });
          } else if (lowerDesc.includes('dash cam')) {
            labourHours = 2;
            items.push({
              type: 'materials',
              name: 'Quality Dash Camera',
              qty: 1,
              cost: 220,
            });
          }
          break;
          
        case 'fourwd_modification':
          hourlyRate = 110;
          if (lowerDesc.includes('light bar')) {
            labourHours = 3;
            items.push({
              type: 'materials',
              name: 'LED Light Bar (Kings/Narva)',
              qty: 1,
              cost: 280,
            });
            items.push({
              type: 'materials',
              name: 'Wiring Harness & Switch',
              qty: 1,
              cost: 65,
            });
          }
          break;
          
        case 'plumbing':
          hourlyRate = 110;
          if (lowerDesc.includes('hot water')) {
            labourHours = 4;
            items.push({
              type: 'materials',
              name: 'Hot Water System',
              qty: 1,
              cost: 850,
            });
          } else if (lowerDesc.includes('toilet')) {
            labourHours = 2;
            items.push({
              type: 'materials',
              name: 'Toilet Suite',
              qty: 1,
              cost: 320,
            });
          }
          break;
          
        case 'carpentry':
          hourlyRate = 95;
          if (lowerDesc.includes('deck')) {
            labourHours = 16;
            items.push({
              type: 'materials',
              name: 'Treated Pine Decking',
              qty: 20,
              cost: 12,
            });
            items.push({
              type: 'materials',
              name: 'Deck Hardware & Fixings',
              qty: 1,
              cost: 150,
            });
          }
          break;
          
        case 'concrete':
          hourlyRate = 95;
          labourHours = 8;
          items.push({
            type: 'materials',
            name: 'Concrete Supply',
            qty: 5,
            cost: 180,
          });
          items.push({
            type: 'materials',
            name: 'Reinforcement & Formwork',
            qty: 1,
            cost: 120,
          });
          break;
          
        case 'painting':
          hourlyRate = 75;
          labourHours = 8;
          items.push({
            type: 'materials',
            name: 'Premium Paint & Primer',
            qty: 1,
            cost: 180,
          });
          break;
          
        case 'landscaping':
          hourlyRate = 85;
          labourHours = 6;
          items.push({
            type: 'materials',
            name: 'Plants & Garden Materials',
            qty: 1,
            cost: 250,
          });
          break;
          
        case 'tiling':
          hourlyRate = 90;
          labourHours = 12;
          items.push({
            type: 'materials',
            name: 'Tiles & Adhesive',
            qty: 1,
            cost: 320,
          });
          break;
          
        case 'roofing':
          hourlyRate = 100;
          labourHours = 8;
          items.push({
            type: 'materials',
            name: 'Roofing Materials',
            qty: 1,
            cost: 450,
          });
          break;
          
        default:
          // Generic trade service
          items.push({
            type: 'materials',
            name: 'Materials & Hardware',
            qty: 1,
            cost: labourHours * 25,
          });
      }
      
      // Add labour
      items.unshift({
        type: 'labour',
        name: `${tradeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Labour`,
        qty: labourHours,
        cost: hourlyRate,
      });
      
      // Add call-out fee for smaller jobs
      if (labourHours < 2) {
        items.push({
          type: 'other',
          name: 'Service Call-Out Fee',
          qty: 1,
          cost: 65,
        });
      }
      
      // Add compliance testing for electrical/plumbing
      if (tradeType === 'electrical' || tradeType === 'plumbing' || tradeType === 'auto_electrical') {
        items.push({
          type: 'other',
          name: 'Testing & Compliance Check',
          qty: 1,
          cost: 85,
        });
      }
      
      return items;
    };

    // Generate job title based on trade type
    const generateJobTitle = (desc: string, tradeType: string) => {
      const lowerDesc = desc.toLowerCase();
      
      switch (tradeType) {
        case 'electrical':
          if (lowerDesc.includes('power point')) return 'Power Point Installation';
          if (lowerDesc.includes('light')) return 'LED Lighting Installation';
          if (lowerDesc.includes('switchboard')) return 'Switchboard Upgrade';
          return 'Electrical Installation';
        case 'auto_electrical':
          if (lowerDesc.includes('dual battery')) return 'Dual Battery System Installation';
          if (lowerDesc.includes('dash cam')) return 'Dash Camera Installation';
          return 'Auto Electrical Service';
        case 'fourwd_modification':
          if (lowerDesc.includes('light bar')) return 'LED Light Bar Installation';
          return '4WD Modification Service';
        case 'plumbing':
          if (lowerDesc.includes('hot water')) return 'Hot Water System Installation';
          if (lowerDesc.includes('toilet')) return 'Toilet Installation';
          return 'Plumbing Service';
        case 'carpentry':
          if (lowerDesc.includes('deck')) return 'Timber Decking Installation';
          return 'Carpentry Service';
        case 'concrete':
          return 'Concrete Work';
        case 'painting':
          return 'Professional Painting Service';
        case 'landscaping':
          return 'Landscaping Service';
        case 'tiling':
          return 'Tiling Installation';
        case 'roofing':
          return 'Roofing Service';
        default:
          return 'Professional Trade Service';
      }
    };

    const tradeType = detectTradeType(job_description);
    const items = generateTradeQuote(job_description, tradeType);
    const jobTitle = generateJobTitle(job_description, tradeType);

    const response = {
      job_title: jobTitle,
      items,
      summary: `Professional ${tradeType.replace('_', ' ')} service completed to Australian trade standards with quality materials and expert workmanship.`,
      client_email: client_email,
      notes: 'All work completed to Australian standards and regulations with full warranty coverage.',
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})