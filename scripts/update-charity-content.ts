import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateSlug } from '../src/lib/slugs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const charitiesToUpdate = [
  {
    name: 'Macmillan Cancer Support',
    long_description: `Macmillan Cancer Support is one of the largest British charities and provides specialist health care, information and financial support to people affected by cancer. It also looks at the social, emotional and practical impact cancer can have, and campaigns for better cancer care.\n\nFrom the moment you're diagnosed, for as long as you need us, you can lean on Macmillan. We help you find your best way through from the moment of diagnosis, so you're able to live life as fully as you can.`,
    image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    upcoming_events: [
      { title: 'The World\'s Biggest Coffee Morning', date: 'Sept 27, 2026', location: 'Nationwide / UK' },
      { title: 'London Marathon Charity Wave', date: 'April 20, 2026', location: 'London, UK' }
    ]
  },
  {
    name: 'British Heart Foundation',
    long_description: `The British Heart Foundation (BHF) is a charity organization in the United Kingdom. It funds research, education, care and awareness campaigns aimed at preventing heart and circulatory diseases.\n\nEvery pound you raise helps us fund the research that saves lives. Heart and circulatory diseases kill 1 in 4 people in the UK. They cause heartbreak on every street. But together, we can beat the heartbreak forever.`,
    image_url: 'https://images.unsplash.com/photo-1505751172107-573225a94501?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    upcoming_events: [
      { title: 'London to Brighton Bike Ride', date: 'June 14, 2026', location: 'London / Brighton' }
    ]
  },
  {
    name: 'WWF UK',
    long_description: `WWF is the world's leading independent conservation organization. Our mission is to create a world where people and wildlife can thrive together.\n\nTo achieve our mission, we're finding ways to help transform the future for the world's wildlife, rivers, forests and seas; pushing for a reduction in carbon emissions that will avoid catastrophic climate change; and pressing for measures to help people live sustainably, within the means of our one planet.`,
    image_url: 'https://images.unsplash.com/photo-1470058869958-2a77bd4469bc?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    upcoming_events: [
      { title: 'Earth Hour 2026', date: 'March 28, 2026', location: 'Global' }
    ]
  }
];

async function updateCharityData() {
  console.log('Synchronizing Charity Nodes...');
  
  for (const item of charitiesToUpdate) {
    const { data: existing, error: findError } = await supabase
      .from('charities')
      .select('id, slug')
      .eq('name', item.name)
      .maybeSingle(); // maybeSingle handles 0 results gracefully
    
    if (findError) {
      console.error(`Error finding ${item.name}:`, findError);
      continue;
    }

    if (existing) {
      console.log(`Updating ${item.name}...`);
      const slug = existing.slug || generateSlug(item.name);
      
      const { error: updateError } = await supabase
        .from('charities')
        .update({
          ...item,
          slug
        })
        .eq('id', existing.id);
      
      if (updateError) console.error(`Error updating ${item.name}:`, updateError);
    } else {
      console.log(`Skipping ${item.name} (not found)`);
    }
  }
  
  console.log('Matrix Synchronization Complete.');
}

updateCharityData();
